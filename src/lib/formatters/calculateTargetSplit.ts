/**
 * Calculate target split time per 500m based on baseline performance and relative offset
 *
 * @param baselineDurationMs - Duration of baseline performance in milliseconds (e.g., 420000 for 7:00)
 * @param baselineDistanceMeters - Distance of baseline performance in meters (e.g., 2000 for 2K)
 * @param relativeSplitMs - Relative split offset in milliseconds (e.g., 20000 for +20 seconds)
 * @returns Target split time per 500m in milliseconds
 *
 * @example
 * // 2K baseline of 7:00 (420000ms) with +20s offset
 * calculateTargetSplit(420000, 2000, 20000)
 * // Returns: 115000 (1:55.0 per 500m)
 */
export function calculateTargetSplit(
	baselineDurationMs: number,
	baselineDistanceMeters: number,
	relativeSplitMs: number,
): number {
	if (baselineDistanceMeters <= 0 || baselineDurationMs <= 0) {
		return NaN;
	}

	const baselineSplitPer500m =
		(baselineDurationMs / baselineDistanceMeters) * 500;

	const targetSplit = baselineSplitPer500m + relativeSplitMs;

	return targetSplit;
}
