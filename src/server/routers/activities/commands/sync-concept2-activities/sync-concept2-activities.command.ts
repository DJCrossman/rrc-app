import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";

const logger = createLogger("sync.concept2");

export async function syncConcept2ActivitiesCommand(
	_input: undefined,
	{ db, athlete, user }: AuthenticatedContext,
) {
	logger.info("sync requested", { userId: user.id, athleteId: athlete.id });

	const batch = await db.activity_inbox.create({
		data: {
			athleteId: athlete.id,
			source: "concept2",
			kind: "sync",
			payload: [],
		},
	});

	return { batchId: batch.id };
}
