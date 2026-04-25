import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import { type Concept2Activity, concept2ActivitySchema } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";

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
	const existingActivityMap = await getExistingActivities({
		db,
		athleteId,
		items,
	});

	let activitiesCreated = 0;
	await db.$transaction(
		async (tx) => {
			for (const item of items) {
				const existingId = existingActivityMap.get(
					item.conceptTwoId.toString(),
				);
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

async function getExistingActivities({
	db,
	athleteId,
	items,
}: {
	db: PrismaClient;
	athleteId: string;
	items: ParsedConcept2Item[];
}): Promise<Map<string, string>> {
	const existing = await db.activity.findMany({
		where: {
			athleteId,
			conceptTwoId: { in: items.map((i) => i.conceptTwoId) },
		},
		select: { id: true, conceptTwoId: true },
	});

	const existingActivityMap = new Map<string, string>();
	for (const row of existing) {
		if (row.conceptTwoId !== null)
			existingActivityMap.set(row.conceptTwoId.toString(), row.id);
	}
	return existingActivityMap;
}

function mergeActivity(item: ParsedConcept2Item) {
	const { activity, conceptTwoId } = item;
	const type: "water" | "erg" = activity.type === "water" ? "water" : "erg";
	return {
		name: `${type === "erg" ? "Erg" : "On-water"} row`,
		startDate: new Date(activity.date_utc),
		timezone: activity.timezone,
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
