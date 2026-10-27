import type { IntensityCategory, WorkoutActivityType } from "@/schemas";
import { IntensityCategories, WorkoutActivityTypes } from "@/schemas";

export interface VolumeTotal {
	minutes: number;
	meters: number;
}

export interface WeekTotals {
	total: VolumeTotal;
	byMode: Record<WorkoutActivityType, VolumeTotal>;
	byZone: Record<IntensityCategory, VolumeTotal>;
	byDay: VolumeTotal[];
	sessionCount: number;
	/** Minutes that carry a zone breakdown — the denominator for "% in zone". */
	composedMinutes: number;
}

export interface WeekTotalsRow {
	dayIndex: number;
	activityType: WorkoutActivityType;
	intensityCategory: IntensityCategory;
	durationMin?: number;
	distanceMeters?: number;
	zoneC1?: number;
	zoneC2?: number;
	zoneC3?: number;
	zoneC4?: number;
	zoneC5?: number;
	zoneC6?: number;
}

export function computeWeekTotals(rows: WeekTotalsRow[]): WeekTotals {
	const totals: WeekTotals = {
		total: emptyVolume(),
		byMode: Object.fromEntries(
			WorkoutActivityTypes.map((mode) => [mode, emptyVolume()]),
		) as Record<WorkoutActivityType, VolumeTotal>,
		byZone: Object.fromEntries(
			IntensityCategories.map((zone) => [zone, emptyVolume()]),
		) as Record<IntensityCategory, VolumeTotal>,
		byDay: Array.from({ length: 7 }, emptyVolume),
		sessionCount: rows.length,
		composedMinutes: 0,
	};

	for (const row of rows) {
		const minutes = row.durationMin ?? 0;
		const meters = row.distanceMeters ?? 0;
		add(totals.total, minutes, meters);
		add(totals.byMode[row.activityType], minutes, meters);
		if (row.dayIndex >= 0 && row.dayIndex < 7) {
			add(totals.byDay[row.dayIndex], minutes, meters);
		}

		const composition = zoneComposition(row);
		if (composition) {
			// Distance follows the minutes: a session split 30/50 puts 30/80ths of
			// its metres in the first zone.
			for (const [zone, zoneMinutes] of composition.entries) {
				add(
					totals.byZone[zone],
					zoneMinutes,
					(meters * zoneMinutes) / composition.total,
				);
			}
			totals.composedMinutes += composition.total;
			continue;
		}

		// Strength work carries no breakdown in the coach's sheet, so it stays out
		// of the zone block entirely; anything else falls back to its single zone.
		if (row.activityType === "strength") continue;
		add(totals.byZone[row.intensityCategory], minutes, meters);
		totals.composedMinutes += minutes;
	}

	return totals;
}

export function toPercent(part: number, whole: number) {
	if (whole <= 0) return 0;
	return (part / whole) * 100;
}

function zoneComposition(row: WeekTotalsRow) {
	const entries: [IntensityCategory, number][] = [];
	let total = 0;
	for (const zone of IntensityCategories) {
		const minutes = row[`zone${zone}` as const] ?? 0;
		if (minutes > 0) {
			entries.push([zone, minutes]);
			total += minutes;
		}
	}
	return total > 0 ? { entries, total } : null;
}

function emptyVolume(): VolumeTotal {
	return { minutes: 0, meters: 0 };
}

function add(target: VolumeTotal, minutes: number, meters: number) {
	target.minutes += minutes;
	target.meters += meters;
}
