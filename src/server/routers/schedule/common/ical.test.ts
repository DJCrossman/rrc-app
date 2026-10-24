import { describe, expect, it } from "vitest";
import { escapeText, foldLine, formatICalendar, type ICalEvent } from "./ical";

const generatedAt = new Date("2026-10-23T12:00:00Z");

const practice: ICalEvent = {
	uid: "evt_1@rrc-app",
	start: new Date("2026-10-20T12:00:00Z"),
	end: new Date("2026-10-20T13:30:00Z"),
	allDay: false,
	timezone: "America/Regina",
	summary: "Morning row",
	location: "Wascana Lake, north dock",
	description: "Workout: Steady state; 3x20'",
	url: "https://example.com/schedule?eventId=evt_1",
	lastModified: new Date("2026-10-01T09:15:00Z"),
};

describe("formatICalendar", () => {
	it("wraps events in a VCALENDAR with CRLF line endings", () => {
		const ics = formatICalendar({
			name: "Regina Rowing Club",
			events: [practice],
			generatedAt,
		});
		expect(ics.endsWith("\r\n")).toBe(true);
		expect(ics.split("\r\n")).toEqual([
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Regina Rowing Club//Schedule//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			"X-WR-CALNAME:Regina Rowing Club",
			"BEGIN:VEVENT",
			"UID:evt_1@rrc-app",
			"DTSTAMP:20261023T120000Z",
			"LAST-MODIFIED:20261001T091500Z",
			"DTSTART:20261020T120000Z",
			"DTEND:20261020T133000Z",
			"SUMMARY:Morning row",
			"LOCATION:Wascana Lake\\, north dock",
			"DESCRIPTION:Workout: Steady state\\; 3x20'",
			"URL:https://example.com/schedule?eventId=evt_1",
			"END:VEVENT",
			"END:VCALENDAR",
			"",
		]);
	});

	it("writes all-day events as local dates with an exclusive end", () => {
		const ics = formatICalendar({
			name: "RRC",
			generatedAt,
			events: [
				{
					...practice,
					start: new Date("2026-10-24T06:00:00Z"),
					end: null,
					allDay: true,
				},
			],
		});
		expect(ics).toContain("DTSTART;VALUE=DATE:20261024\r\n");
		expect(ics).toContain("DTEND;VALUE=DATE:20261025\r\n");
	});

	it("leaves out DTEND and empty optional fields when there are none", () => {
		const ics = formatICalendar({
			name: "RRC",
			generatedAt,
			events: [
				{
					...practice,
					end: null,
					location: null,
					description: null,
					url: null,
				},
			],
		});
		expect(ics).not.toContain("DTEND");
		expect(ics).not.toContain("LOCATION");
		expect(ics).not.toContain("DESCRIPTION");
		expect(ics).not.toContain("URL");
	});

	it("returns an empty calendar when there are no events", () => {
		const ics = formatICalendar({ name: "RRC", events: [], generatedAt });
		expect(ics).not.toContain("BEGIN:VEVENT");
		expect(ics).toContain("END:VCALENDAR");
	});
});

describe("escapeText", () => {
	it("escapes backslashes, separators and newlines", () => {
		expect(escapeText("a\\b;c,d\ne\r\nf")).toBe("a\\\\b\\;c\\,d\\ne\\nf");
	});
});

describe("foldLine", () => {
	it("leaves lines of 75 octets alone", () => {
		const line = "x".repeat(75);
		expect(foldLine(line)).toBe(line);
	});

	it("folds long lines into 75-octet chunks continued by a space", () => {
		const folded = foldLine(`DESCRIPTION:${"a".repeat(150)}`);
		const lines = folded.split("\r\n");
		expect(lines[0]).toHaveLength(75);
		expect(lines.slice(1).every((line) => line.startsWith(" "))).toBe(true);
		expect(lines.every((line) => line.length <= 75)).toBe(true);
		expect(lines.map((line, i) => (i ? line.slice(1) : line)).join("")).toBe(
			`DESCRIPTION:${"a".repeat(150)}`,
		);
	});

	it("never splits a multi-byte character", () => {
		const encoder = new TextEncoder();
		const line = `SUMMARY:${"é".repeat(60)}`;
		const lines = foldLine(line).split("\r\n");
		expect(lines.every((part) => encoder.encode(part).length <= 75)).toBe(true);
		expect(lines.map((part, i) => (i ? part.slice(1) : part)).join("")).toBe(
			line,
		);
	});
});
