import { describe, expect, it } from "vitest";
import {
	findPromptRange,
	isRepeatPrompt,
	resolvePromptDays,
	resolvePromptUntil,
} from "./resolvePromptDays";

// 2026-11-04 is a Wednesday.
const START = "2026-11-04";

describe("resolvePromptDays", () => {
	it("counts weekdays forward from the start date", () => {
		expect(resolvePromptDays(["Wednesday", "Friday", "Monday"], START)).toEqual(
			["2026-11-04", "2026-11-06", "2026-11-09"],
		);
	});

	it("accepts short names, today, tomorrow and explicit dates", () => {
		expect(
			resolvePromptDays(["tue", "today", "Tomorrow", "2026-12-01"], START),
		).toEqual(["2026-11-04", "2026-11-05", "2026-11-10", "2026-12-01"]);
	});

	it("drops duplicates and days it can't read", () => {
		expect(resolvePromptDays(["Friday", "fri", "someday"], START)).toEqual([
			"2026-11-06",
		]);
	});

	it("repeats weekdays every week through the end date", () => {
		expect(
			resolvePromptDays(
				["Monday", "Friday", "2026-11-05"],
				START,
				"2026-11-20",
			),
		).toEqual([
			"2026-11-05",
			"2026-11-06",
			"2026-11-09",
			"2026-11-13",
			"2026-11-16",
			"2026-11-20",
		]);
	});

	it("repeats dated days weekly only when asked", () => {
		expect(
			resolvePromptDays(["2026-11-14", "today"], START, "2026-11-28", {
				repeatDates: true,
			}),
		).toEqual([
			"2026-11-04",
			"2026-11-11",
			"2026-11-14",
			"2026-11-18",
			"2026-11-21",
			"2026-11-25",
			"2026-11-28",
		]);
		expect(resolvePromptDays(["2026-11-14"], START, "2026-11-28")).toEqual([
			"2026-11-14",
		]);
	});
});

describe("isRepeatPrompt", () => {
	it("spots a request to repeat everything", () => {
		expect(isRepeatPrompt("repeat every week until end of march")).toBe(true);
		expect(isRepeatPrompt("Weekly through March")).toBe(true);
		expect(isRepeatPrompt("Mon 6am erg until March")).toBe(false);
	});
});

describe("resolvePromptUntil", () => {
	it("reads a month as its last day, in the coming year when needed", () => {
		expect(resolvePromptUntil({ until: "March" }, START)).toBe("2027-03-31");
		expect(resolvePromptUntil({ until: "dec" }, START)).toBe("2026-12-31");
		expect(resolvePromptUntil({ until: "the end of March" }, START)).toBe(
			"2027-03-31",
		);
	});

	it("rolls a date the model put in the past forward a year", () => {
		expect(resolvePromptUntil({ until: "2026-03-31" }, START)).toBe(
			"2027-03-31",
		);
		expect(resolvePromptUntil({ until: "2027-01-15" }, START)).toBe(
			"2027-01-15",
		);
	});

	it("reads a day within the month", () => {
		expect(resolvePromptUntil({ until: "Dec 18" }, START)).toBe("2026-12-18");
		expect(resolvePromptUntil({ until: "March 3rd" }, START)).toBe(
			"2027-03-03",
		);
	});

	it("counts weeks from the start date", () => {
		expect(resolvePromptUntil({ weeks: 2 }, START)).toBe("2026-11-17");
	});

	it("ignores nothing to repeat and caps at a year out", () => {
		expect(resolvePromptUntil({}, START)).toBeUndefined();
		expect(resolvePromptUntil({ until: "someday" }, START)).toBeUndefined();
		expect(resolvePromptUntil({ until: "2029-01-01" }, START)).toBe(
			"2027-11-04",
		);
	});
});

describe("findPromptRange", () => {
	it("finds the one range written in the prompt", () => {
		expect(
			findPromptRange(
				"Mon/Wed 6am erg until the end of March\nThursday 6pm coached erg",
				START,
			),
		).toBe("2027-03-31");
		expect(findPromptRange("Tue 5pm erg for 3 weeks", START)).toBe(
			"2026-11-24",
		);
		expect(findPromptRange("Fri 6am erg through Dec 18", START)).toBe(
			"2026-12-18",
		);
	});

	it("leaves no range or two different ranges to the model", () => {
		expect(findPromptRange("Mon 6am erg 9 to 11", START)).toBeUndefined();
		expect(
			findPromptRange("Mon erg until December\nSat erg until March", START),
		).toBeUndefined();
		expect(
			findPromptRange(
				"Mon erg until March\nSat erg until the end of March",
				START,
			),
		).toBe("2027-03-31");
	});
});
