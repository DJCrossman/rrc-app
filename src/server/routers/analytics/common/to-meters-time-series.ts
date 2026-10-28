export function toMetersTimeSeries(
	rows: { startDate: Date; type: string; distance: number }[],
) {
	const seriesMap = new Map<string, { boat: number; erg: number }>();
	for (const row of rows) {
		const day = row.startDate.toISOString().split("T")[0];
		const entry = seriesMap.get(day) ?? { boat: 0, erg: 0 };
		if (row.type === "water") entry.boat += row.distance;
		else entry.erg += row.distance;
		seriesMap.set(day, entry);
	}
	return Array.from(seriesMap.entries()).map(([date, v]) => ({
		date,
		...v,
	}));
}
