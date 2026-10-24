import { DateTime } from "luxon";
import type { EventAudience, EventType } from "@/schemas/schedule.schema";

const LOCALE = "en-US";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
	training: "Training",
	regatta: "Regatta",
	volunteer: "Volunteer",
};

export function formatEventTime({
	type,
	startAt,
	endAt,
	allDay,
	timezone,
}: {
	type: EventType;
	startAt: Date | string;
	endAt: Date | string | null;
	allDay: boolean;
	timezone: string;
}): string {
	if (allDay) {
		return "All day";
	}
	const start = toZoned(startAt, timezone);
	if (!endAt) {
		return type === "regatta"
			? `Due ${formatClock(start)}`
			: formatClock(start);
	}
	const end = toZoned(endAt, timezone);
	const sameMeridiem =
		start.toFormat("a", { locale: LOCALE }) ===
		end.toFormat("a", { locale: LOCALE });
	if (start.hasSame(end, "day") && sameMeridiem) {
		return `${start.toFormat("h:mm", { locale: LOCALE })} – ${formatClock(end)}`;
	}
	return `${formatClock(start)} – ${formatClock(end)}`;
}

export function formatEventDate(
	startAt: Date | string,
	timezone: string,
): string {
	return toZoned(startAt, timezone).toFormat("cccc, LLL d", {
		locale: LOCALE,
	});
}

export function formatGroupLabel(
	audience: EventAudience,
	groupIds: string[],
): string {
	if (audience === "club" || groupIds.length === 0) {
		return "Club-wide";
	}
	return groupIds.join(", ");
}

function toZoned(value: Date | string, timezone: string): DateTime {
	const date = typeof value === "string" ? new Date(value) : value;
	return DateTime.fromJSDate(date, { zone: timezone });
}

function formatClock(date: DateTime): string {
	return date.toFormat("h:mm a", { locale: LOCALE });
}
