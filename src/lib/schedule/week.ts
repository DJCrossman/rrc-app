import { DateTime } from "luxon";

export const CLUB_TIMEZONE = "America/Regina";

const LOCALE = "en-US";

// Luxon weekday the week starts on (1 = Monday … 7 = Sunday). The training plan
// starts weeks on Sunday while the design shows Monday-first weeks.
const WEEK_STARTS_ON = 7;

export function startOfWeek(date: DateTime<true>): DateTime<true> {
	const offset = (date.weekday - WEEK_STARTS_ON + 7) % 7;
	return date.startOf("day").minus({ days: offset });
}

export function parseWeekStart(
	isoDate?: string,
	now: DateTime<true> = DateTime.now(),
): DateTime<true> {
	const parsed = isoDate
		? DateTime.fromISO(isoDate, { zone: CLUB_TIMEZONE })
		: null;
	if (parsed?.isValid) {
		return startOfWeek(parsed);
	}
	return startOfWeek(now.setZone(CLUB_TIMEZONE) as DateTime<true>);
}

export function getWeekDays(weekStart: DateTime<true>): DateTime<true>[] {
	return Array.from({ length: 7 }, (_, index) =>
		weekStart.plus({ days: index }),
	);
}

export function getClubToday(now: DateTime<true> = DateTime.now()): string {
	return (now.setZone(CLUB_TIMEZONE) as DateTime<true>).toISODate();
}

export function formatWeekRange(weekStart: DateTime<true>): string {
	const end = weekStart.plus({ days: 6 });
	const format = (date: DateTime<true>, pattern: string) =>
		date.toFormat(pattern, { locale: LOCALE });
	if (weekStart.year !== end.year) {
		return `${format(weekStart, "LLL d, yyyy")} – ${format(end, "LLL d, yyyy")}`;
	}
	if (weekStart.month !== end.month) {
		return `${format(weekStart, "LLL d")} – ${format(end, "LLL d, yyyy")}`;
	}
	return `${format(weekStart, "LLL d")} – ${format(end, "d, yyyy")}`;
}

export function bucketByDay<T>(
	days: DateTime<true>[],
	items: T[],
	getDate: (item: T) => string,
): { date: string; items: T[] }[] {
	const buckets = new Map<string, T[]>(
		days.map((day) => [day.toISODate(), []]),
	);
	for (const item of items) {
		buckets.get(getDate(item))?.push(item);
	}
	return [...buckets].map(([date, bucket]) => ({ date, items: bucket }));
}
