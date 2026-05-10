import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";

const logger = createLogger("sync.strava");

export async function syncStravaActivitiesCommand(
	_input: undefined,
	{ db, athlete, user }: AuthenticatedContext,
) {
	logger.info("sync requested", { userId: user.id, athleteId: athlete.id });

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
