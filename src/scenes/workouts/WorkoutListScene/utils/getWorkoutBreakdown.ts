import type { Workout } from "@/schemas";

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
