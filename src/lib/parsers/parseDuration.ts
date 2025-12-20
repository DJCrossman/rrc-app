/**
 * Parses duration from workout description strings.
 * Supports formats like: 70', 90', 2x20', etc.
 * @param description - The workout description text
 * @returns Duration in milliseconds, or undefined if not found
 */
export function parseDuration(description: string): number | undefined {
	// Match patterns like: 70', 90', 2x20', 3 x 25', etc.
	const patterns = [
		/(\d+)'/g, // Simple format: 70', 90'
		/\d+\s*x\s*(\d+)'/g, // Multiplied format: 2x20', 3 x 25'
	];

	const matches: number[] = [];

	for (const pattern of patterns) {
		let match: RegExpExecArray | null = null;
		match = pattern.exec(description);
		while (match !== null) {
			const minutes = Number.parseInt(match[1], 10);
			if (!Number.isNaN(minutes)) {
				matches.push(minutes);
			}
			match = pattern.exec(description);
		}
	}

	if (matches.length === 0) {
		return undefined;
	}

	// Sum all found durations (e.g., "2x20'" would be parsed as one 20' match)
	// For multiplied formats, we just take the base duration
	const totalMinutes = matches.reduce((sum, min) => sum + min, 0);

	// Convert minutes to milliseconds
	return totalMinutes * 60 * 1000;
}
