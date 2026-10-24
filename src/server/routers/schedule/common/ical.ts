import { DateTime } from "luxon";

export type ICalEvent = {
	uid: string;
	start: Date;
	end: Date | null;
	allDay: boolean;
	timezone: string;
	summary: string;
	location?: string | null;
	description?: string | null;
	url?: string | null;
	lastModified: Date;
};

const MAX_LINE_OCTETS = 75;
const encoder = new TextEncoder();

export function formatICalendar({
	name,
	events,
	generatedAt = new Date(),
}: {
	name: string;
	events: ICalEvent[];
	generatedAt?: Date;
}): string {
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Regina Rowing Club//Schedule//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${escapeText(name)}`,
		...events.flatMap((event) => formatEvent(event, generatedAt)),
		"END:VCALENDAR",
	];
	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function escapeText(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r\n|\r|\n/g, "\\n");
}

export function foldLine(line: string): string {
	if (encoder.encode(line).length <= MAX_LINE_OCTETS) {
		return line;
	}
	const parts: string[] = [];
	let current = "";
	let currentOctets = 0;
	let limit = MAX_LINE_OCTETS;
	for (const char of line) {
		const octets = encoder.encode(char).length;
		if (currentOctets + octets > limit) {
			parts.push(current);
			current = "";
			currentOctets = 0;
			limit = MAX_LINE_OCTETS - 1;
		}
		current += char;
		currentOctets += octets;
	}
	parts.push(current);
	return parts.join("\r\n ");
}

function formatEvent(event: ICalEvent, generatedAt: Date): string[] {
	return [
		"BEGIN:VEVENT",
		`UID:${event.uid}`,
		`DTSTAMP:${formatUtc(generatedAt)}`,
		`LAST-MODIFIED:${formatUtc(event.lastModified)}`,
		...formatDates(event),
		`SUMMARY:${escapeText(event.summary)}`,
		...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
		...(event.description
			? [`DESCRIPTION:${escapeText(event.description)}`]
			: []),
		...(event.url ? [`URL:${event.url}`] : []),
		"END:VEVENT",
	];
}

function formatDates(event: ICalEvent): string[] {
	if (event.allDay) {
		const start = DateTime.fromJSDate(event.start, { zone: event.timezone });
		const lastDay = event.end
			? DateTime.fromJSDate(event.end, { zone: event.timezone })
			: start;
		return [
			`DTSTART;VALUE=DATE:${start.toFormat("yyyyLLdd")}`,
			`DTEND;VALUE=DATE:${lastDay.plus({ days: 1 }).toFormat("yyyyLLdd")}`,
		];
	}
	return [
		`DTSTART:${formatUtc(event.start)}`,
		...(event.end ? [`DTEND:${formatUtc(event.end)}`] : []),
	];
}

function formatUtc(date: Date): string {
	return DateTime.fromJSDate(date, { zone: "utc" }).toFormat(
		"yyyyLLdd'T'HHmmss'Z'",
	);
}
