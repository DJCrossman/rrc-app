import { DateTime } from "luxon";
import type { Prisma } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import {
	type Concept2Activity,
	concept2ActivitySchema,
	stravaActivitySchema,
} from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import {
	type CrossSourceShape,
	concept2MatchShape,
	crossSourceWindow,
	findCrossSourceMatch,
	lockAthleteActivities,
	parseStoredJson,
	stravaMatchShape,
} from "../../common/cross-source-activity";

const logger = createLogger("inbox.processor.concept2");

export type ProcessConcept2InboxBatchInput = { batchId: string };

export async function processConcept2InboxBatchCommand(
	input: ProcessConcept2InboxBatchInput,
	{ db }: Pick<AuthenticatedContext, "db">,
) {
	const claimed = await db.activity_inbox.updateMany({
		where: { id: input.batchId, status: "pending" },
		data: { status: "running", attempts: { increment: 1 } },
	});

	if (claimed.count === 0) {
		const current = await db.activity_inbox.findUnique({
			where: { id: input.batchId },
			select: { status: true },
		});
		logger.info("batch not claimable", {
			batchId: input.batchId,
			status: current?.status ?? "missing",
		});
		return { batchId: input.batchId, claimed: false, activitiesCreated: 0 };
	}

	const batch = await db.activity_inbox.findUniqueOrThrow({
		where: { id: input.batchId },
	});
	logger.info("batch claimed", {
		batchId: batch.id,
		athleteId: batch.athleteId,
	});

	const rawItems = Array.isArray(batch.payload) ? batch.payload : [];
	const athleteId = batch.athleteId;

	const { items, invalidItems } = parseBatchActivities(rawItems);

	let activitiesCreated = 0;
	await db.$transaction(
		async (tx) => {
			await lockAthleteActivities({ tx, athleteId });
			const { byConceptTwoId, stravaOnly } = await getExistingActivities({
				db: tx,
				athleteId,
				items,
			});

			for (const item of items) {
				const data = mergeActivity(item);
				const existing =
					byConceptTwoId.get(item.conceptTwoId.toString()) ??
					takeCrossSourceMatch({
						shape: concept2MatchShape({
							startDate: data.startDate,
							result: item.activity,
						}),
						pool: stravaOnly,
					});

				if (existing) {
					await tx.activity.update({
						where: { id: existing.id },
						data: {
							...data,
							// Keep the athlete-authored Strava title on merged rows.
							...(existing.stravaId !== null ? { name: undefined } : {}),
						},
					});
					continue;
				}

				await tx.activity.create({
					data: { ...data, athlete: { connect: { id: athleteId } } },
				});
				activitiesCreated += 1;
			}

			await tx.activity_inbox.update({
				where: { id: batch.id },
				data: {
					status: "completed",
					completedAt: new Date(),
					activitiesCreated,
				},
			});
		},
		{ timeout: 60_000 },
	);

	logger.info("batch completed", {
		batchId: batch.id,
		activitiesCreated,
		invalidItems,
		itemCount: rawItems.length,
	});

	return { batchId: batch.id, claimed: true, activitiesCreated };
}

type ParsedConcept2Item = {
	activity: Concept2Activity;
	conceptTwoId: bigint;
};

function parseBatchActivities(rawItems: unknown[]): {
	items: ParsedConcept2Item[];
	invalidItems: number;
} {
	let invalidItems = 0;
	const items: ParsedConcept2Item[] = [];
	for (const raw of rawItems) {
		const parsed = concept2ActivitySchema.safeParse(raw);
		if (!parsed.success) {
			invalidItems += 1;
			continue;
		}
		items.push({
			activity: parsed.data,
			conceptTwoId: BigInt(parsed.data.id),
		});
	}
	return { items, invalidItems };
}

type ExistingActivity = { id: string; stravaId: bigint | null };
type StravaOnlyActivity = ExistingActivity & CrossSourceShape;

async function getExistingActivities({
	db,
	athleteId,
	items,
}: {
	db: Prisma.TransactionClient;
	athleteId: string;
	items: ParsedConcept2Item[];
}): Promise<{
	byConceptTwoId: Map<string, ExistingActivity>;
	stravaOnly: StravaOnlyActivity[];
}> {
	const byConceptTwoId = new Map<string, ExistingActivity>();
	if (items.length === 0) return { byConceptTwoId, stravaOnly: [] };

	const [existing, stravaOnly] = await Promise.all([
		db.activity.findMany({
			where: {
				athleteId,
				conceptTwoId: { in: items.map((i) => i.conceptTwoId) },
			},
			select: { id: true, stravaId: true, conceptTwoId: true },
		}),
		db.activity.findMany({
			where: {
				athleteId,
				conceptTwoId: null,
				stravaId: { not: null },
				startDate: crossSourceWindow(
					items.map((i) => mergeActivity(i).startDate),
				),
			},
			select: { id: true, stravaId: true, startDate: true, stravaData: true },
		}),
	]);

	for (const row of existing) {
		if (row.conceptTwoId !== null)
			byConceptTwoId.set(row.conceptTwoId.toString(), row);
	}
	return {
		byConceptTwoId,
		stravaOnly: stravaOnly.flatMap((row) => {
			const activity = parseStoredJson({
				schema: stravaActivitySchema.pick({
					elapsed_time: true,
					distance: true,
					name: true,
				}),
				raw: row.stravaData,
			});
			if (!activity) return [];
			return [
				{
					id: row.id,
					stravaId: row.stravaId,
					...stravaMatchShape({
						startDate: row.startDate,
						activity,
					}),
				},
			];
		}),
	};
}

function takeCrossSourceMatch({
	shape,
	pool,
}: {
	shape: CrossSourceShape;
	pool: StravaOnlyActivity[];
}): ExistingActivity | undefined {
	const match = findCrossSourceMatch({ target: shape, candidates: pool });
	if (match) pool.splice(pool.indexOf(match), 1);
	return match;
}

export function mapConcept2Activity(activity: Concept2Activity) {
	return mergeActivity({ activity, conceptTwoId: BigInt(activity.id) });
}

function mergeActivity(item: ParsedConcept2Item) {
	const { activity, conceptTwoId } = item;
	const type: "water" | "erg" = activity.type === "water" ? "water" : "erg";
	const timezone = activity.timezone ?? "UTC";
	// Concept2 dates are SQL-style with no offset, so parse them in an explicit
	// zone rather than letting the runtime assume its own. `date_utc` is
	// nullable; `date` is local to the result's timezone.
	const startDate = activity.date_utc
		? DateTime.fromSQL(activity.date_utc, { zone: "utc" })
		: DateTime.fromSQL(activity.date, { zone: timezone });
	return {
		name: `${type === "erg" ? "Erg" : "On-water"} row`,
		startDate: startDate.toJSDate(),
		timezone,
		workoutType: mapWorkoutType(activity.workout_type),
		// Concept2 `time` is in deciseconds (tenths of seconds);
		// the app expects milliseconds.
		elapsedTime: activity.time * 100,
		distance: Math.round(activity.distance),
		type,
		conceptTwoData: activity as unknown as Prisma.InputJsonValue,
		conceptTwoId,
	};
}

function mapWorkoutType(raw: string): "distance" | "time" | "other" {
	const lower = raw.toLowerCase();
	if (lower.includes("distance")) return "distance";
	if (lower.includes("time")) return "time";
	return "other";
}
