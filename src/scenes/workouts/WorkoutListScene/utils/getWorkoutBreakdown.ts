import type { Workout } from "@/app/api/v1/workouts/actions";

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
