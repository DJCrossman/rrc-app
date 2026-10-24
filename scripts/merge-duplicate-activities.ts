#!/usr/bin/env bun

/**
 * One-off backfill: merge Strava and Concept2 copies of the same piece into a
 * single activity row.
 *
 * Before cross-source matching existed, a Concept2 result that the Logbook also
 * pushed to Strava was stored twice — once per webhook. This pairs each
 * Strava-only row with the Concept2-only row it duplicates (same matcher the
 * inbox processors now use), moves the Strava id/data/title onto the Concept2
 * row, and deletes the Strava row.
 *
 * Dry run by default; pass --apply to write. Uses DATABASE_URL.
 *
 *   bun run db:merge-duplicate-activities            # report only
 *   bun run db:merge-duplicate-activities --apply    # merge
 */

import { PrismaNeon } from "@prisma/adapter-neon";
import { type Prisma, PrismaClient } from "@/generated/prisma/client";
import {
	findCrossSourceMatch,
	lockAthleteActivities,
} from "@/server/routers/activities/common/cross-source-activity";

const apply = process.argv.includes("--apply");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error("❌ DATABASE_URL is not set.");
	process.exit(1);
}

const db = new PrismaClient({
	adapter: new PrismaNeon({ connectionString }),
});

const select = {
	id: true,
	name: true,
	startDate: true,
	elapsedTime: true,
	distance: true,
	boatId: true,
	ergId: true,
	workoutId: true,
	stravaId: true,
	stravaData: true,
	conceptTwoId: true,
} as const;

async function mergeAthlete(athleteId: string, label: string) {
	return db.$transaction(
		async (tx) => {
			// Hold the same lock as the webhooks so a live event can't race us.
			await lockAthleteActivities(tx, athleteId);

			const [stravaOnly, concept2Only] = await Promise.all([
				tx.activity.findMany({
					where: { athleteId, stravaId: { not: null }, conceptTwoId: null },
					select,
					orderBy: { startDate: "asc" },
				}),
				tx.activity.findMany({
					where: { athleteId, conceptTwoId: { not: null }, stravaId: null },
					select,
				}),
			]);

			let merged = 0;
			for (const strava of stravaOnly) {
				const concept2 = findCrossSourceMatch(strava, concept2Only);
				if (!concept2) continue;
				concept2Only.splice(concept2Only.indexOf(concept2), 1);
				merged += 1;

				console.log(
					`  ${label}: ${strava.startDate.toISOString()}  ` +
						`"${strava.name}" ${strava.distance}m (strava ${strava.stravaId})  ⇐  ` +
						`"${concept2.name}" ${concept2.distance}m (concept2 ${concept2.conceptTwoId})`,
				);
				if (!apply) continue;

				// Free the (athleteId, stravaId) unique slot before reusing it.
				await tx.activity.delete({ where: { id: strava.id } });
				await tx.activity.update({
					where: { id: concept2.id },
					data: {
						name: strava.name,
						stravaId: strava.stravaId,
						stravaData: (strava.stravaData ?? undefined) as
							| Prisma.InputJsonValue
							| undefined,
						boatId: concept2.boatId ?? strava.boatId,
						ergId: concept2.ergId ?? strava.ergId,
						workoutId: concept2.workoutId ?? strava.workoutId,
					},
				});
			}
			return merged;
		},
		{ timeout: 120_000 },
	);
}

async function main() {
	console.log(
		apply
			? "🔀 Merging duplicate Strava/Concept2 activities…"
			: "🔎 Dry run — pass --apply to merge.",
	);

	const athletes = await db.athlete.findMany({
		where: {
			activities: {
				some: { stravaId: { not: null }, conceptTwoId: null },
			},
		},
		select: { id: true, firstName: true, lastName: true },
	});

	let total = 0;
	for (const athlete of athletes) {
		total += await mergeAthlete(
			athlete.id,
			`${athlete.firstName} ${athlete.lastName}`,
		);
	}

	console.log(
		apply
			? `\n✅ Merged ${total} duplicate activit${total === 1 ? "y" : "ies"}.`
			: `\n${total} duplicate activit${total === 1 ? "y" : "ies"} would be merged.`,
	);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
