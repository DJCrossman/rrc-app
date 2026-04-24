import type { Workout } from "@/lib/trpc/types";

export const getWorkoutBreakdown = <T extends Workout>({
	description,
	...workout
}: T) => {
	const [title, ...descriptionLines] = description.split(";");
	return {
		...workout,
		title,
		descriptionLines,
	};
};
