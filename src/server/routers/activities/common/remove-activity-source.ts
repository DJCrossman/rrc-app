import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { concept2ActivitySchema, stravaActivitySchema } from "@/schemas";
import { mapConcept2Activity } from "../commands/process-concept2-inbox-batch/process-concept2-inbox-batch.command";
import { mapStravaActivity } from "../commands/process-strava-inbox-batch/process-strava-inbox-batch.command";
import { lockAthleteActivities } from "./cross-source-activity";

function parseStored<T>(
	schema: { safeParse: (raw: unknown) => { success: boolean; data?: T } },
	raw: Prisma.JsonValue,
): T | undefined {
	if (!raw) return undefined;
	const normalized = JSON.parse(
		JSON.stringify(raw, (_key, value) => (value === null ? undefined : value)),
	);
	return schema.safeParse(normalized).data;
}

/**
 * Removes one integration's copy of an activity. A row that only that
 * integration knows about is deleted; a row merged with the other integration
 * is kept and falls back to the remaining source's data.
 */
export async function removeActivitySource(
	db: PrismaClient,
	{
		athleteId,
		source,
		externalId,
	}: {
		athleteId: string;
		source: "strava" | "concept2";
		externalId: number | bigint;
	},
): Promise<{ deleted: number; unlinked: number }> {
	return db.$transaction(async (tx) => {
		await lockAthleteActivities(tx, athleteId);
		const id = BigInt(externalId);
		const rows = await tx.activity.findMany({
			where:
				source === "strava"
					? { athleteId, stravaId: id }
					: { athleteId, conceptTwoId: id },
			select: {
				id: true,
				stravaId: true,
				stravaData: true,
				conceptTwoId: true,
				conceptTwoData: true,
			},
		});

		let deleted = 0;
		let unlinked = 0;
		for (const row of rows) {
			if (source === "strava" && row.conceptTwoId !== null) {
				const remaining = parseStored(
					concept2ActivitySchema,
					row.conceptTwoData,
				);
				await tx.activity.update({
					where: { id: row.id },
					data: {
						...(remaining ? mapConcept2Activity(remaining) : {}),
						stravaId: null,
						stravaData: Prisma.DbNull,
					},
				});
				unlinked += 1;
			} else if (source === "concept2" && row.stravaId !== null) {
				const remaining = parseStored(stravaActivitySchema, row.stravaData);
				await tx.activity.update({
					where: { id: row.id },
					data: {
						...(remaining ? mapStravaActivity(remaining) : {}),
						conceptTwoId: null,
						conceptTwoData: Prisma.DbNull,
					},
				});
				unlinked += 1;
			} else {
				await tx.activity.delete({ where: { id: row.id } });
				deleted += 1;
			}
		}
		return { deleted, unlinked };
	});
}
