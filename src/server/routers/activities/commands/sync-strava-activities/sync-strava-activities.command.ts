import { TRPCError } from "@trpc/server";
import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";

const logger = createLogger("sync.strava");

export async function syncStravaActivitiesCommand(
	_input: undefined,
	{ db, userId }: AuthenticatedContext,
) {
	logger.info("sync requested", { userId });
	const athlete = await db.athlete.findUnique({ where: { userId } });
	if (!athlete) {
		logger.error("athlete not found", { userId });
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Athlete profile not found",
		});
	}

	const batch = await db.activity_inbox.create({
		data: {
			athleteId: athlete.id,
			source: "strava",
			kind: "sync",
			payload: [],
		},
	});

	return { batchId: batch.id };
}
