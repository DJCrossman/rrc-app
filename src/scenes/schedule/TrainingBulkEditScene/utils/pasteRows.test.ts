import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { CLUB_TIMEZONE } from "@/lib/schedule/week";
import { isDelimitedRows, parseDelimitedRows } from "./pasteRows";

const weekStart = DateTime.fromISO("2026-10-25", { zone: CLUB_TIMEZONE });

describe("isDelimitedRows", () => {
	it("treats tab-separated or multi-line text as rows", () => {
		expect(isDelimitedRows("mon\t06:00")).toBe(true);
		expect(isDelimitedRows("a,b\nc,d")).toBe(true);
		expect(isDelimitedRows("just one line")).toBe(false);
	});
});

describe("parseDelimitedRows", () => {
	it("maps spreadsheet cells onto row fields in column order", () => {
		const [row] = parseDelimitedRows(
			"Wed\t17:30\terg\t2k prep\tRate ladder\tC5\ttime\t70\t16000\t1\t60\t10",
			weekStart,
		);
		expect(row).toMatchObject({
			dayIndex: 3,
			time: "17:30",
			activityType: "erg",
			title: "2k prep",
			description: "Rate ladder",
			intensityCategory: "C5",
			durationMin: 70,
			distanceMeters: 16000,
			zoneC6: 60,
			zoneC5: 10,
		});
	});

	it("titles an untitled row from its pasted time and mode", () => {
		const [row] = parseDelimitedRows("1,18:00,erg\n2,06:00,water", weekStart);
		expect(row.dayIndex).toBe(1);
		expect(row.title).toBe("Evening erg");
	});
});
