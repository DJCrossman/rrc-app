import type { CreateWorkout } from "@/schemas";
import type { Context } from "@/server/context";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "@/server/routers/workouts/common/map-to-workout-dto";

export async function createWorkoutCommand(
	input: CreateWorkout,
	{ db }: Context,
) {
	const workout = await db.workout.create({
		data: {
			description: input.description,
			startDate: new Date(input.startDate),
			workoutType: input.workoutType,
			elapsedTime: input.elapsedTime,
			distance: input.distance,
			intervalCount: input.intervalCount ?? 1,
			intensityCategory: input.intensityCategory,
			fragments: input.fragments?.length
				? { create: input.fragments }
				: undefined,
		},
		include: workoutInclude,
	});
	return mapToWorkoutDto(workout);
}
