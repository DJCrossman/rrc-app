import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { getWeekStreak } from "./get-week-streak";

const at = (iso: string) => DateTime.fromISO(iso, { zone: "utc" });
const dates = (...isos: string[]) => isos.map((iso) => new Date(iso));

describe("getWeekStreak", () => {
	it("counts consecutive weeks back from the current one", () => {
		const activities = dates(
			"2026-10-28T13:18:00Z",
			"2026-10-26T13:17:00Z",
			"2026-10-24T14:17:00Z",
			"2026-10-23T13:16:00Z",
			"2026-10-14T13:08:00Z",
			"2026-10-11T22:09:00Z",
			"2026-09-30T12:45:00Z",
		);
		expect(getWeekStreak(activities, at("2026-10-29T01:07:00Z"))).toBe(3);
	});

	it("keeps last week's streak alive while this week is still empty", () => {
		const activities = dates("2026-10-23T13:16:00Z", "2026-10-14T13:08:00Z");
		expect(getWeekStreak(activities, at("2026-10-27T12:00:00Z"))).toBe(2);
	});

	it("is zero once a full week passes with nothing logged", () => {
		const activities = dates("2026-10-14T13:08:00Z");
		expect(getWeekStreak(activities, at("2026-10-27T12:00:00Z"))).toBe(0);
	});

	it("treats Sunday as the first day of its week", () => {
		const activities = dates("2026-10-25T15:00:00Z", "2026-10-24T15:00:00Z");
		expect(getWeekStreak(activities, at("2026-10-25T18:00:00Z"))).toBe(2);
	});

	it("is zero with no activities", () => {
		expect(getWeekStreak([], at("2026-10-28T12:00:00Z"))).toBe(0);
	});
});
