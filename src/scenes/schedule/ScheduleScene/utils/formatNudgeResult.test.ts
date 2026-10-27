import { describe, expect, it } from "vitest";
import { formatNudgeResult } from "./formatNudgeResult";

describe("formatNudgeResult", () => {
	it("keeps it short when everyone was reached", () => {
		expect(formatNudgeResult(7, 7)).toBe("Reminder sent to 7 people");
		expect(formatNudgeResult(1, 1)).toBe("Reminder sent to 1 person");
	});

	it("says how many couldn't be reached", () => {
		expect(formatNudgeResult(7, 3)).toBe(
			"Reminder sent to 3 of 7 — 4 don't have notifications on",
		);
		expect(formatNudgeResult(4, 3)).toBe(
			"Reminder sent to 3 of 4 — 1 doesn't have notifications on",
		);
	});

	it("is honest when nobody could be reached", () => {
		expect(formatNudgeResult(5, 0)).toBe(
			"Reminder sent to 0 of 5 — 5 don't have notifications on",
		);
	});
});
