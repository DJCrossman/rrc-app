import type { DateTime } from "luxon";
import {
	autoTitle,
	type BulkRow,
	createEmptyTrainingRow,
} from "./trainingRows";

export function isTextEntryTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function isDelimitedRows(text: string) {
	if (text.includes("\t")) return true;
	return text.trim().split(/\r?\n/).filter(Boolean).length > 1;
}

export function parseDelimitedRows(
	text: string,
	weekStart: DateTime,
): BulkRow[] {
	const lines = text
		.replace(/\r\n/g, "\n")
		.split("\n")
		.filter((line) => line.trim().length > 0);
	if (lines.length === 0) return [];
	const delimiter = lines[0].includes("\t") ? "\t" : ",";
	return lines.map((line) => {
		const cells = line.split(delimiter);
		const row: Record<string, unknown> = {
			...createEmptyTrainingRow(0, weekStart),
			__id: crypto.randomUUID(),
		};
		let hasTitle = false;
		cells.forEach((cell, index) => {
			const key = PASTE_COLUMN_KEYS[index];
			const value = cell.trim();
			if (!key || !value) return;
			if (key === "dayIndex") {
				row.dayIndex = parseDayCell(value);
			} else if (NUMERIC_PASTE_KEYS.has(key)) {
				row[key] = Number(value);
			} else {
				row[key] = value;
				if (key === "title") hasTitle = true;
			}
		});
		// A pasted row with no title of its own gets one that matches its pasted
		// time and mode, not the defaults it started from.
		if (!hasTitle) row.title = autoTitle(row as BulkRow);
		return row as BulkRow;
	});
}

const PASTE_COLUMN_KEYS = [
	"dayIndex",
	"time",
	"activityType",
	"title",
	"description",
	"intensityCategory",
	"workoutType",
	"durationMin",
	"distanceMeters",
	"intervalCount",
	"zoneC6",
	"zoneC5",
	"zoneC4",
	"zoneC3",
	"zoneC2",
	"zoneC1",
] as const;

const NUMERIC_PASTE_KEYS = new Set<string>([
	"durationMin",
	"distanceMeters",
	"intervalCount",
	"zoneC1",
	"zoneC2",
	"zoneC3",
	"zoneC4",
	"zoneC5",
	"zoneC6",
]);

function parseDayCell(value: string) {
	const numeric = Number(value);
	if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 6) return numeric;
	const index = DAY_NAMES.findIndex((name) =>
		value.toLowerCase().startsWith(name),
	);
	return index >= 0 ? index : 0;
}

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
