import { describe, expect, it } from "vitest";
import {
	formatEventDate,
	formatEventTime,
	formatGroupLabel,
} from "./event-labels";

const timezone = "America/Regina";

describe("formatEventTime", () => {
	it("collapses the meridiem when both ends share it", () => {
		expect(
			formatEventTime({
				type: "training",
				startAt: "2026-10-20T12:00:00Z",
				endAt: "2026-10-20T13:30:00Z",
				allDay: false,
				timezone,
			}),
		).toBe("6:00 – 7:30 AM");
	});

	it("keeps both meridiems when the event crosses noon", () => {
		expect(
			formatEventTime({
				type: "training",
				startAt: "2026-10-20T17:00:00Z",
				endAt: "2026-10-20T19:00:00Z",
				allDay: false,
				timezone,
			}),
		).toBe("11:00 AM – 1:00 PM");
	});

	it("labels all-day events", () => {
		expect(
			formatEventTime({
				type: "regatta",
				startAt: "2026-10-24T06:00:00Z",
				endAt: null,
				allDay: true,
				timezone,
			}),
		).toBe("All day");
	});

	it("shows a regatta without an end as a deadline", () => {
		expect(
			formatEventTime({
				type: "regatta",
				startAt: "2026-10-22T23:00:00Z",
				endAt: null,
				allDay: false,
				timezone,
			}),
		).toBe("Due 5:00 PM");
	});

	it("shows only the start for other events without an end", () => {
		expect(
			formatEventTime({
				type: "training",
				startAt: new Date("2026-10-22T12:00:00Z"),
				endAt: null,
				allDay: false,
				timezone,
			}),
		).toBe("6:00 AM");
	});
});

describe("formatEventDate", () => {
	it("uses the event's timezone", () => {
		expect(formatEventDate("2026-10-21T03:00:00Z", timezone)).toBe(
			"Tuesday, Oct 20",
		);
	});
});

describe("formatGroupLabel", () => {
	it("labels club events and falls back to group ids", () => {
		expect(formatGroupLabel("club", ["grp_a"])).toBe("Club-wide");
		expect(formatGroupLabel("groups", ["grp_a", "grp_b"])).toBe("grp_a, grp_b");
	});
});
