import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
	formatLastReply,
	formatReactors,
	groupMessagesByDay,
} from "./messageFormatting";

const zone = "America/Regina";
const now = DateTime.fromISO("2026-10-23T09:30:00", { zone });
const message = (id: string, local: string) => ({
	id,
	createdAt: DateTime.fromISO(local, { zone }).toUTC().toISO() ?? "",
});

describe("groupMessagesByDay", () => {
	it("labels today, yesterday and older days in local time", () => {
		const days = groupMessagesByDay(
			[
				message("a", "2025-12-31T18:00:00"),
				message("b", "2026-10-21T07:00:00"),
				message("c", "2026-10-22T23:30:00"),
				message("d", "2026-10-23T00:15:00"),
				message("e", "2026-10-23T06:05:00"),
			],
			now,
		);
		expect(
			days.map((day) => [day.label, day.messages.map((m) => m.id)]),
		).toEqual([
			["Wednesday, December 31, 2025", ["a"]],
			["Wednesday, October 21", ["b"]],
			["Yesterday", ["c"]],
			["Today", ["d", "e"]],
		]);
	});
});

describe("formatLastReply", () => {
	it("shows the time for today and the date otherwise", () => {
		expect(
			formatLastReply(message("x", "2026-10-23T06:05:00").createdAt, now),
		).toBe("6:05 AM");
		expect(
			formatLastReply(message("y", "2026-10-20T06:05:00").createdAt, now),
		).toBe("Oct 20");
	});
});

describe("formatReactors", () => {
	it("joins names naturally", () => {
		expect(formatReactors(["You"])).toBe("You");
		expect(formatReactors(["You", "Sarah Chen"])).toBe("You and Sarah Chen");
		expect(formatReactors(["You", "Sarah Chen", "Mike Lee"])).toBe(
			"You, Sarah Chen and Mike Lee",
		);
	});
});
