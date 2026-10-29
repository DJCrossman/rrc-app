import { DateTime } from "luxon";

// Consecutive Sun–Sat weeks with at least one activity. A week with nothing
// logged yet doesn't break the streak until it's over, so counting starts from
// last week when this week is still empty.
export function getWeekStreak(dates: Date[], now: DateTime) {
	const activeWeeks = new Set(
		dates.map((date) =>
			startOfWeek(DateTime.fromJSDate(date, { zone: "utc" })).toISODate(),
		),
	);

	let cursor = startOfWeek(now);
	if (!activeWeeks.has(cursor.toISODate())) {
		cursor = cursor.minus({ weeks: 1 });
	}

	let streak = 0;
	while (activeWeeks.has(cursor.toISODate())) {
		streak++;
		cursor = cursor.minus({ weeks: 1 });
	}
	return streak;
}

// Luxon weekday is Mon=1…Sun=7, so `weekday % 7` is the number of days since
// Sunday (Sun→0), which keeps a Sunday in its own week.
export function startOfWeek(date: DateTime) {
	return date.minus({ days: date.weekday % 7 }).startOf("day");
}
