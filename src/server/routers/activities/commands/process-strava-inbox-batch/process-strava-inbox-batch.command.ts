import type { Prisma } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import {
	concept2ActivitySchema,
	type StravaActivity,
	stravaActivitySchema,
} from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import {
	type CrossSourceShape,
	concept2MatchShape,
	crossSourceWindow,
	findCrossSourceMatch,
	getConceptTwoIdFromStrava,
	lockAthleteActivities,
	parseStoredJson,
	stravaMatchShape,
} from "../../common/cross-source-activity";

const logger = createLogger("inbox.processor.strava");

export type ProcessStravaInboxBatchInput = { batchId: string };

export async function processStravaInboxBatchCommand(
	input: ProcessStravaInboxBatchInput,
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
			const { byStravaId, byConceptTwoId, concept2Only } =
				await getExistingActivities({ db: tx, athleteId, items });

			for (const item of items) {
				const data = mergeActivity(item);
				const split = findSplitCopies({ item, byStravaId, byConceptTwoId });
				if (split) {
					// An earlier sync missed the pairing and stored this piece twice.
					// Fold the Strava copy into the Concept2 row, keeping any boat,
					// erg or workout the athlete attached to either.
					await tx.activity.delete({ where: { id: split.strava.id } });
					await tx.activity.update({
						where: { id: split.concept2.id },
						data: {
							name: data.name,
							stravaId: data.stravaId,
							stravaData: data.stravaData,
							boatId: split.concept2.boatId ?? split.strava.boatId,
							ergId: split.concept2.ergId ?? split.strava.ergId,
							workoutId: split.concept2.workoutId ?? split.strava.workoutId,
						},
					});
					continue;
				}

				// An explicit Concept2 id is authoritative — if that result
				// hasn't arrived yet, it will find this row by id when it does.
				const existing =
					resolveExistingId({ item, byStravaId, byConceptTwoId }) ??
					(item.conceptTwoId === null
						? takeCrossSourceMatch({
								shape: stravaMatchShape({
									startDate: data.startDate,
									activity: item.activity,
								}),
								pool: concept2Only,
							})
						: undefined);

				if (existing) {
					await tx.activity.update({
						where: { id: existing.id },
						// Concept2 is the source of truth for the piece's metrics;
						// Strava contributes the athlete-authored title.
						data: existing.hasConcept2Data
							? {
									name: data.name,
									stravaId: data.stravaId,
									stravaData: data.stravaData,
								}
							: data,
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

type ParsedStravaItem = {
	activity: StravaActivity;
	stravaId: bigint;
	conceptTwoId: bigint | null;
};

function parseBatchActivities(rawItems: unknown[]): {
	items: ParsedStravaItem[];
	invalidItems: number;
} {
	let invalidItems = 0;
	const items: ParsedStravaItem[] = [];
	for (const raw of rawItems) {
		const parsed = stravaActivitySchema.safeParse(raw);
		if (!parsed.success) {
			invalidItems += 1;
			continue;
		}
		items.push({
			activity: parsed.data,
			stravaId: BigInt(parsed.data.id),
			conceptTwoId: getConceptTwoIdFromStrava(parsed.data),
		});
	}
	return { items, invalidItems };
}

type ExistingActivity = {
	id: string;
	hasConcept2Data: boolean;
	boatId: string | null;
	ergId: string | null;
	workoutId: string | null;
};
type Concept2OnlyActivity = ExistingActivity & CrossSourceShape;

async function getExistingActivities({
	db,
	athleteId,
	items,
}: {
	db: Prisma.TransactionClient;
	athleteId: string;
	items: ParsedStravaItem[];
}): Promise<{
	byStravaId: Map<string, ExistingActivity>;
	byConceptTwoId: Map<string, ExistingActivity>;
	concept2Only: Concept2OnlyActivity[];
}> {
	const byStravaId = new Map<string, ExistingActivity>();
	const byConceptTwoId = new Map<string, ExistingActivity>();
	if (items.length === 0)
		return { byStravaId, byConceptTwoId, concept2Only: [] };

	const stravaIds = items.map((i) => i.stravaId);
	const conceptTwoIds = items
		.map((i) => i.conceptTwoId)
		.filter((id): id is bigint => id !== null);

	const [existing, concept2Only] = await Promise.all([
		db.activity.findMany({
			where: {
				athleteId,
				OR: [
					{ stravaId: { in: stravaIds } },
					...(conceptTwoIds.length
						? [{ conceptTwoId: { in: conceptTwoIds } }]
						: []),
				],
			},
			select: {
				id: true,
				stravaId: true,
				conceptTwoId: true,
				conceptTwoData: true,
				boatId: true,
				ergId: true,
				workoutId: true,
			},
		}),
		db.activity.findMany({
			where: {
				athleteId,
				stravaId: null,
				conceptTwoId: { not: null },
				startDate: crossSourceWindow(
					items.map((i) => new Date(i.activity.start_date)),
				),
			},
			select: {
				id: true,
				startDate: true,
				conceptTwoData: true,
				boatId: true,
				ergId: true,
				workoutId: true,
			},
		}),
	]);

	for (const row of existing) {
		const entry = {
			id: row.id,
			hasConcept2Data: row.conceptTwoData !== null,
			boatId: row.boatId,
			ergId: row.ergId,
			workoutId: row.workoutId,
		};
		if (row.stravaId !== null) byStravaId.set(row.stravaId.toString(), entry);
		if (row.conceptTwoId !== null)
			byConceptTwoId.set(row.conceptTwoId.toString(), entry);
	}
	return {
		byStravaId,
		byConceptTwoId,
		concept2Only: concept2Only.flatMap((row) => {
			const result = parseStoredJson({
				schema: concept2ActivitySchema.pick({
					time: true,
					rest_time: true,
					distance: true,
				}),
				raw: row.conceptTwoData,
			});
			if (!result) return [];
			return [
				{
					id: row.id,
					hasConcept2Data: true,
					boatId: row.boatId,
					ergId: row.ergId,
					workoutId: row.workoutId,
					...concept2MatchShape({
						startDate: row.startDate,
						result,
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
	pool: Concept2OnlyActivity[];
}): ExistingActivity | undefined {
	const match = findCrossSourceMatch({ target: shape, candidates: pool });
	if (match) pool.splice(pool.indexOf(match), 1);
	return match;
}

export function mapStravaActivity(activity: StravaActivity) {
	return mergeActivity({
		activity,
		stravaId: BigInt(activity.id),
		conceptTwoId: null,
	});
}

function mergeActivity(item: ParsedStravaItem) {
	const { activity, stravaId, conceptTwoId } = item;
	const type: "water" | "erg" = isStravaOnWater(activity) ? "water" : "erg";
	return {
		name: activity.name,
		startDate: new Date(activity.start_date),
		timezone: activity.timezone,
		workoutType: inferWorkoutType(activity.name, activity.description),
		// Strava `elapsed_time` is in seconds; the app expects milliseconds.
		elapsedTime: activity.elapsed_time * 1000,
		distance: Math.round(activity.distance),
		type,
		stravaData: activity as unknown as Prisma.InputJsonValue,
		stravaId,
		...(conceptTwoId !== null ? { conceptTwoId } : {}),
	};
}

function findSplitCopies({
	item,
	byStravaId,
	byConceptTwoId,
}: {
	item: ParsedStravaItem;
	byStravaId: Map<string, ExistingActivity>;
	byConceptTwoId: Map<string, ExistingActivity>;
}): { strava: ExistingActivity; concept2: ExistingActivity } | undefined {
	if (item.conceptTwoId === null) return undefined;
	const strava = byStravaId.get(item.stravaId.toString());
	const concept2 = byConceptTwoId.get(item.conceptTwoId.toString());
	if (!strava || !concept2 || strava.id === concept2.id) return undefined;
	return { strava, concept2 };
}

function resolveExistingId({
	item,
	byStravaId,
	byConceptTwoId,
}: {
	item: ParsedStravaItem;
	byStravaId: Map<string, ExistingActivity>;
	byConceptTwoId: Map<string, ExistingActivity>;
}): ExistingActivity | undefined {
	const stravaMatch = byStravaId.get(item.stravaId.toString());
	if (stravaMatch) return stravaMatch;
	if (item.conceptTwoId === null) return undefined;
	return byConceptTwoId.get(item.conceptTwoId.toString());
}

// Strava's `workout_type` field only carries semantics for runs/rides, not
// rowing. Infer from the user-authored name + description: explicit distance
// markers like "6000m" → distance; time markers like "30:00" → time. Default
// to "time" when ambiguous (no signal, or both signals present).
function inferWorkoutType(
	name: string | null | undefined,
	description: string | null | undefined,
): "time" | "distance" {
	const text = `${name ?? ""} ${description ?? ""}`;
	if (/\d+\s*m\b/i.test(text)) return "distance";
	if (/\d{1,2}:\d{2}/.test(text)) return "time";
	return "time";
}

function isStravaOnWater(activity: StravaActivity): boolean {
	if (activity.trainer) return false;
	if (
		Array.isArray(activity.start_latlng) &&
		activity.start_latlng.length > 0
	) {
		return true;
	}
	if (activity.map?.summary_polyline) return true;
	return false;
}
