import { DateTime } from "luxon";
import type { Workout } from "@/lib/trpc/types";

export const getWorkoutBreakdown = <T extends Workout>({
	description,
	...workout
}: T) => {
	const trimmed = description?.trim() ?? "";
	if (!trimmed) {
		const hour = DateTime.fromISO(workout.startDate).hour;
		return {
			...workout,
			title: hour < 12 ? "Morning row" : "Evening row",
			descriptionLines: [] as string[],
		};
	}
	const [title, ...descriptionLines] = trimmed.split(";");
	return {
		...workout,
		title,
		descriptionLines,
	};
};
