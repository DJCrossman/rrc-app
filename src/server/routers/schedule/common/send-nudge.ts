import { createLogger } from "@/lib/logger";

const logger = createLogger("schedule.nudge");

// Push delivery belongs to the notifications domain; this is the one call site
// to hand the recipients to its sendPush service.
export async function sendNudge({
	eventId,
	title,
	athleteIds,
}: {
	eventId: string;
	title: string;
	athleteIds: string[];
}) {
	logger.info("nudge requested", {
		eventId,
		title,
		recipients: athleteIds.length,
		athleteIds,
	});
}
