import { DateTime } from "luxon";
import {
	NOTIFICATION_SCOPE_SCHEDULE,
	type PushMessage,
} from "@/lib/notifications";
import { routes } from "@/lib/routes";
import { CLUB_TIMEZONE, startOfWeek } from "@/lib/schedule/week";
import type { EventType } from "@/schemas";

export type SessionSnapshot = {
	id: string;
	type: EventType;
	startAt: string;
	location: string | null;
	timezone: string;
};

export type ScheduleChange = {
	eventId: string;
	type: EventType;
	cancelled: boolean;
	weekStart: string;
};

export type ScheduleNotification = {
	athleteIds: string[];
	message: PushMessage;
};

// Only what changes whether or where an athlete turns up is worth a push; workout
// tweaks stay silent, and sessions already under way are history, not news.
export function detectScheduleChange(
	before: SessionSnapshot,
	after: SessionSnapshot | null,
	now: DateTime = DateTime.now(),
): ScheduleChange | null {
	if (!isUpcoming(before.startAt, now)) return null;
	if (!after) {
		return {
			eventId: before.id,
			type: before.type,
			cancelled: true,
			weekStart: weekOf(before),
		};
	}
	const moved = !sameMinute(before.startAt, after.startAt);
	const relocated = (before.location ?? null) !== (after.location ?? null);
	if (!moved && !relocated) return null;
	return {
		eventId: before.id,
		type: before.type,
		cancelled: false,
		weekStart: weekOf(after),
	};
}

// One push per athlete per save: each athlete's changes collapse into a single
// summary, and athletes who'd get the same summary share one send.
export function planScheduleNotifications(
	changes: ScheduleChange[],
	interestedByEvent: Map<string, string[]>,
): ScheduleNotification[] {
	const changesByAthlete = new Map<string, ScheduleChange[]>();
	for (const change of changes) {
		for (const athleteId of interestedByEvent.get(change.eventId) ?? []) {
			changesByAthlete.set(athleteId, [
				...(changesByAthlete.get(athleteId) ?? []),
				change,
			]);
		}
	}
	const byMessage = new Map<string, ScheduleNotification>();
	for (const [athleteId, athleteChanges] of changesByAthlete) {
		const message = buildScheduleChangeMessage(athleteChanges);
		const key = `${message.title}|${message.url}`;
		const existing = byMessage.get(key);
		if (existing) {
			existing.athleteIds.push(athleteId);
		} else {
			byMessage.set(key, { athleteIds: [athleteId], message });
		}
	}
	return [...byMessage.values()];
}

export function buildScheduleChangeMessage(
	changes: ScheduleChange[],
): PushMessage {
	const weekStart = changes.map((change) => change.weekStart).sort()[0];
	const count = changes.length;
	const noun = changes.every((change) => change.type === "training")
		? "practice"
		: "event";
	const article = noun === "event" ? "An" : "A";
	const subject = count === 1 ? `${article} ${noun}` : `${count} ${noun}s`;
	const cancelled = changes.every((change) => change.cancelled);
	const verb = cancelled
		? count === 1
			? "has been cancelled"
			: "have been cancelled"
		: count === 1
			? "has changed"
			: "have changed";
	const week = DateTime.fromISO(weekStart, {
		zone: CLUB_TIMEZONE,
	}) as DateTime<true>;
	return {
		title: `${subject} for the week of ${week.toFormat("LLL d", { locale: "en-US" })} ${verb}`,
		body: "Open the schedule to see what's different.",
		url: routes.schedule.list({ week }),
		scope: NOTIFICATION_SCOPE_SCHEDULE,
	};
}

// Who a change to this event would reach: athletes going or maybe, and only
// while the event is still ahead.
export function countNotifiable(
	event: { startAt: string; counts: { going: number; maybe: number } },
	now: DateTime = DateTime.now(),
) {
	return isUpcoming(event.startAt, now)
		? event.counts.going + event.counts.maybe
		: 0;
}

function isUpcoming(startAt: string, now: DateTime) {
	return DateTime.fromISO(startAt) > now;
}

function weekOf({ startAt, timezone }: SessionSnapshot) {
	return startOfWeek(
		DateTime.fromISO(startAt, { zone: timezone }) as DateTime<true>,
	).toISODate();
}

function sameMinute(a: string, b: string) {
	return DateTime.fromISO(a)
		.startOf("minute")
		.equals(DateTime.fromISO(b).startOf("minute"));
}
