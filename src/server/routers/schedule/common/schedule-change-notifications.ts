import { after } from "next/server";
import { createLogger } from "@/lib/logger";
import {
	detectScheduleChange,
	planScheduleNotifications,
	type ScheduleChange,
	type ScheduleNotification,
	type SessionSnapshot,
} from "@/lib/schedule/changes";
import type { CreateEvent } from "@/schemas";
import type { PushService } from "@/server/services/push-service";

const logger = createLogger("schedule.notify");

// The "before" picture of an event, read ahead of a write. RSVPs have to be
// captured here: deleting an event cascades them away.
export const notifiableEventSelect = {
	id: true,
	type: true,
	startAt: true,
	location: true,
	timezone: true,
	rsvps: {
		where: { status: { in: ["yes" as const, "maybe" as const] } },
		select: { athleteId: true },
	},
};

type NotifiableEvent = {
	id: string;
	type: SessionSnapshot["type"];
	startAt: Date;
	location: string | null;
	timezone: string;
	rsvps: { athleteId: string }[];
};

export function planChangeNotifications(
	before: NotifiableEvent[],
	after: Map<string, SessionSnapshot | null>,
): ScheduleNotification[] {
	const changes = before
		.filter(({ id }) => after.has(id))
		.map((event) =>
			detectScheduleChange(toSnapshot(event), after.get(event.id) ?? null),
		)
		.filter((change): change is ScheduleChange => change !== null);
	const interested = new Map(
		before.map(({ id, rsvps }) => [
			id,
			rsvps.map(({ athleteId }) => athleteId),
		]),
	);
	return planScheduleNotifications(changes, interested);
}

export function toEventSnapshot(
	id: string,
	event: CreateEvent,
): SessionSnapshot {
	return {
		id,
		type: event.type,
		startAt: event.startAt,
		location: event.location ?? null,
		timezone: event.timezone,
	};
}

// Pushes go out once the response is flushed, so a save never waits on them and
// a delivery failure can't roll back what the coach already saved.
export function sendAfterResponse(
	push: PushService,
	notifications: ScheduleNotification[],
) {
	if (notifications.length === 0) return;
	after(async () => {
		for (const { athleteIds, message } of notifications) {
			try {
				await push.sendPush(athleteIds, message);
			} catch (error) {
				logger.error("schedule change push failed", {
					title: message.title,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
	});
}

function toSnapshot(event: NotifiableEvent): SessionSnapshot {
	return {
		id: event.id,
		type: event.type,
		startAt: event.startAt.toISOString(),
		location: event.location,
		timezone: event.timezone,
	};
}
