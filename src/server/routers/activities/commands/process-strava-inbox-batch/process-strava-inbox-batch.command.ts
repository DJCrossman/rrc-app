import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import { type StravaActivity, stravaActivitySchema } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";

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
	const { byStravaId, byConceptTwoId } = await getExistingActivities({
		db,
		athleteId,
		items,
	});

	let activitiesCreated = 0;
	await db.$transaction(
		async (tx) => {
			for (const item of items) {
				const existingId = resolveExistingId(item, byStravaId, byConceptTwoId);
				const data = mergeActivity(item);

				if (existingId) {
					await tx.activity.update({ where: { id: existingId }, data });
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
		// When a Strava activity was uploaded from a Concept2 erg, the
		// external_id mirrors the Concept2 activity id. Capture it so we can
		// merge with a pre-existing Concept2 row instead of creating a duplicate.
		let conceptTwoId: bigint | null = null;
		if (parsed.data.device_name === "concept2" && parsed.data.external_id) {
			try {
				conceptTwoId = BigInt(parsed.data.external_id);
			} catch {
				conceptTwoId = null;
			}
		}
		items.push({
			activity: parsed.data,
			stravaId: BigInt(parsed.data.id),
			conceptTwoId,
		});
	}
	return { items, invalidItems };
}

async function getExistingActivities({
	db,
	athleteId,
	items,
}: {
	db: PrismaClient;
	athleteId: string;
	items: ParsedStravaItem[];
}): Promise<{
	byStravaId: Map<string, string>;
	byConceptTwoId: Map<string, string>;
}> {
	const stravaIds = items.map((i) => i.stravaId);
	const conceptTwoIds = items
		.map((i) => i.conceptTwoId)
		.filter((id): id is bigint => id !== null);

	const existing = await db.activity.findMany({
		where: {
			athleteId,
			OR: [
				{ stravaId: { in: stravaIds } },
				...(conceptTwoIds.length
					? [{ conceptTwoId: { in: conceptTwoIds } }]
					: []),
			],
		},
		select: { id: true, stravaId: true, conceptTwoId: true },
	});

	const byStravaId = new Map<string, string>();
	const byConceptTwoId = new Map<string, string>();
	for (const row of existing) {
		if (row.stravaId !== null) byStravaId.set(row.stravaId.toString(), row.id);
		if (row.conceptTwoId !== null)
			byConceptTwoId.set(row.conceptTwoId.toString(), row.id);
	}
	return { byStravaId, byConceptTwoId };
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

function resolveExistingId(
	item: ParsedStravaItem,
	byStravaId: Map<string, string>,
	byConceptTwoId: Map<string, string>,
): string | undefined {
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
