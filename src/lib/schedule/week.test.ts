import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
	bucketByDay,
	CLUB_TIMEZONE,
	formatWeekRange,
	getClubToday,
	getWeekDays,
	parseWeekStart,
	startOfWeek,
} from "./week";

const clubDate = (iso: string) =>
	DateTime.fromISO(iso, { zone: CLUB_TIMEZONE }) as DateTime<true>;

describe("startOfWeek", () => {
	it("starts weeks on Sunday", () => {
		expect(startOfWeek(clubDate("2026-10-21T15:30")).toISODate()).toBe(
			"2026-10-18",
		);
	});

	it("keeps a Sunday in its own week", () => {
		expect(startOfWeek(clubDate("2026-10-25T08:00")).toISODate()).toBe(
			"2026-10-25",
		);
	});

	it("puts Saturday at the end of the week", () => {
		expect(startOfWeek(clubDate("2026-10-24T23:59")).toISODate()).toBe(
			"2026-10-18",
		);
	});
});

describe("parseWeekStart", () => {
	const now = clubDate("2026-10-23T09:00");

	it("snaps a mid-week date to the start of its week", () => {
		expect(parseWeekStart("2026-10-22", now).toISODate()).toBe("2026-10-18");
	});

	it("falls back to the current week for a missing or invalid date", () => {
		expect(parseWeekStart(undefined, now).toISODate()).toBe("2026-10-18");
		expect(parseWeekStart("not-a-date", now).toISODate()).toBe("2026-10-18");
	});

	it("reads the current week in the club timezone", () => {
		const lateUtcSaturday = DateTime.fromISO("2026-10-25T03:00Z", {
			zone: "utc",
		}) as DateTime<true>;
		expect(parseWeekStart(undefined, lateUtcSaturday).toISODate()).toBe(
			"2026-10-18",
		);
		expect(getClubToday(lateUtcSaturday)).toBe("2026-10-24");
	});
});

describe("formatWeekRange", () => {
	it("formats a week inside one month", () => {
		expect(formatWeekRange(clubDate("2026-10-18"))).toBe("Oct 18 – 24, 2026");
		expect(formatWeekRange(clubDate("2026-10-25"))).toBe("Oct 25 – 31, 2026");
	});

	it("formats a week across two months", () => {
		expect(formatWeekRange(clubDate("2026-11-29"))).toBe(
			"Nov 29 – Dec 5, 2026",
		);
	});

	it("formats a week across two years", () => {
		expect(formatWeekRange(clubDate("2026-12-27"))).toBe(
			"Dec 27, 2026 – Jan 2, 2027",
		);
	});
});

describe("bucketByDay", () => {
	const days = getWeekDays(clubDate("2026-10-18"));

	it("returns seven days starting on the week start", () => {
		expect(days.map((day) => day.toISODate())).toEqual([
			"2026-10-18",
			"2026-10-19",
			"2026-10-20",
			"2026-10-21",
			"2026-10-22",
			"2026-10-23",
			"2026-10-24",
		]);
	});

	it("groups items by date, keeps their order and leaves empty days empty", () => {
		const items = [
			{ id: "a", date: "2026-10-20" },
			{ id: "b", date: "2026-10-18" },
			{ id: "c", date: "2026-10-20" },
		];
		const buckets = bucketByDay(days, items, ({ date }) => date);
		expect(buckets).toHaveLength(7);
		expect(buckets[0]).toEqual({ date: "2026-10-18", items: [items[1]] });
		expect(buckets[2].items.map(({ id }) => id)).toEqual(["a", "c"]);
		expect(buckets[1].items).toEqual([]);
	});

	it("drops items outside the week", () => {
		const buckets = bucketByDay(
			days,
			[{ date: "2026-10-17" }, { date: "2026-10-25" }, { date: "2026-10-24" }],
			({ date }) => date,
		);
		expect(buckets.flatMap(({ items }) => items)).toEqual([
			{ date: "2026-10-24" },
		]);
	});
});
