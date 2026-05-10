import type { IntegrationSource } from "@/generated/prisma/client";
import type { AuthenticatedContext } from "@/server/context";
import { mapToInboxDto } from "../../common/map-to-inbox-dto";

const STALE_RUNNING_MS = 15 * 60 * 1000;
const STALE_PENDING_MS = 5 * 60 * 1000;

const SOURCES: IntegrationSource[] = ["strava", "concept2"];

export async function getPendingInboxBatchesQuery(
	_input: undefined,
	{ db, athlete }: AuthenticatedContext,
) {
	const now = new Date();
	await db.activity_inbox.updateMany({
		where: {
			athleteId: athlete.id,
			status: "running",
			receivedAt: { lt: new Date(now.getTime() - STALE_RUNNING_MS) },
		},
		data: {
			status: "failed",
			completedAt: now,
			errorMessage: "Sync timed out",
		},
	});
	await db.activity_inbox.updateMany({
		where: {
			athleteId: athlete.id,
			status: "pending",
			receivedAt: { lt: new Date(now.getTime() - STALE_PENDING_MS) },
		},
		data: {
			status: "failed",
			completedAt: now,
			errorMessage: "Sync was never picked up",
		},
	});

	const [rows, ...latestPerSource] = await Promise.all([
		db.activity_inbox.findMany({
			where: {
				athleteId: athlete.id,
				status: { in: ["pending", "running"] },
			},
			orderBy: { receivedAt: "desc" },
		}),
		...SOURCES.map((source) =>
			db.activity_inbox.findFirst({
				where: { athleteId: athlete.id, source },
				orderBy: { receivedAt: "desc" },
				select: { source: true, receivedAt: true },
			}),
		),
	]);

	const latestBySource = {} as Record<IntegrationSource, string | null>;
	for (const source of SOURCES) latestBySource[source] = null;
	for (const entry of latestPerSource) {
		if (entry) latestBySource[entry.source] = entry.receivedAt.toISOString();
	}

	return { data: rows.map(mapToInboxDto), latestBySource };
}
