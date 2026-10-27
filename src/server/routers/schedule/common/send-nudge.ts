import { DateTime } from "luxon";
import { createLogger } from "@/lib/logger";
import {
	NOTIFICATION_SCOPE_SCHEDULE,
	type PushMessage,
} from "@/lib/notifications";
import { routes } from "@/lib/routes";
import { formatEventTime } from "@/lib/schedule/event-labels";
import type { EventType } from "@/schemas";
import type { PushService } from "@/server/services/push-service";

const logger = createLogger("schedule.nudge");

type NudgeEvent = {
	id: string;
	type: EventType;
	title: string;
	startAt: Date;
	endAt: Date | null;
	allDay: boolean;
	timezone: string;
};

export async function sendNudge(
	push: PushService,
	{ event, athleteIds }: { event: NudgeEvent; athleteIds: string[] },
) {
	const result = await push.sendPush(athleteIds, buildNudgeMessage(event));
	logger.info("nudge sent", {
		eventId: event.id,
		recipients: athleteIds.length,
		reached: result.reached,
	});
	return result;
}

export function buildNudgeMessage(event: NudgeEvent): PushMessage {
	const day = DateTime.fromJSDate(event.startAt, {
		zone: event.timezone,
	}).toFormat("ccc LLL d", { locale: "en-US" });
	return {
		title: event.type === "volunteer" ? "Can you help?" : "Are you coming?",
		body: `${event.title} — ${day}, ${formatEventTime(event)}`,
		url: routes.schedule.view({ id: event.id }),
		// A second nudge for the same event replaces the first on the device.
		tag: `nudge-${event.id}`,
		scope: NOTIFICATION_SCOPE_SCHEDULE,
	};
}
