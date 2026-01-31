export const formatSplit = (
	durationMs: number,
	distanceMeters: number,
): string => {
	// Calculate split per 500m in milliseconds
	const splitMs = (durationMs / distanceMeters) * 500;

	// Convert to seconds with decimal precision
	const totalSeconds = splitMs / 1000;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const secondsFormatted = seconds.toFixed(3).padStart(6, "0");

	return `${minutes.toString().padStart(2, "0")}:${secondsFormatted}/500m`;
};
