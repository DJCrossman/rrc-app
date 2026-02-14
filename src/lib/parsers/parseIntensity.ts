/**
 * Parses intensity category from workout description strings.
 * Looks for patterns like: C1, C2, C3, C4, C5, C6
 * @param description - The workout description text
 * @returns Intensity category as "C1" through "C6", defaults to "C6" if not found
 */

const isIntensityCategoryNumber = (
	value: string,
): value is "1" | "2" | "3" | "4" | "5" | "6" => {
	return ["1", "2", "3", "4", "5", "6"].includes(value);
};

export function parseIntensity(
	description: string,
): "C1" | "C2" | "C3" | "C4" | "C5" | "C6" {
	// Match pattern: C followed by digit 1-6 (case insensitive)
	const match = description.match(/C([1-6])/i);

	if (match?.[1] && isIntensityCategoryNumber(match[1])) {
		return `C${match[1]}`;
	}

	// Default to C6 (easiest intensity) if not found
	return "C6";
}
