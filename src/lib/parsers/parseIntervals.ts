/**
 * Parses interval count from workout description strings.
 * Supports formats like: 3x3km, 2x2000m, 8 x 2.5', 2x2km + 4x500m, etc.
 * @param description - The workout description text
 * @returns Total number of intervals, or 1 if no interval pattern found
 */
export function parseIntervals(description: string): number {
	// Match patterns like: 3x3km, 2x2000m, 8 x 2.5', etc.
	// Captures the number before 'x' (with optional spaces)
	const pattern = /(\d+)\s*x\s*/gi;

	const matches: number[] = [];
	let match = pattern.exec(description);

	while (match !== null) {
		const count = Number.parseInt(match[1], 10);
		if (!Number.isNaN(count)) {
			matches.push(count);
		}
		match = pattern.exec(description);
	}

	if (matches.length === 0) {
		return 1; // Default to 1 for steady state or non-interval workouts
	}

	// Sum all interval counts (e.g., "2x2km + 4x500m" = 2 + 4 = 6)
	return matches.reduce((sum, count) => sum + count, 0);
}
