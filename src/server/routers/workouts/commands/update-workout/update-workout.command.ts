import type { UpdateWorkout } from "@/schemas";
import type { Context } from "@/server/context";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "@/server/routers/workouts/common/map-to-workout-dto";

export async function updateWorkoutCommand(
	input: UpdateWorkout,
	{ db }: Context,
) {
	const workout = await db.workout.update({
		where: { id: input.id },
		data: {
			description: input.description,
			startDate: new Date(input.startDate),
			workoutType: input.workoutType,
			elapsedTime: input.elapsedTime,
			distance: input.distance,
			intervalCount: input.intervalCount ?? 1,
			intensityCategory: input.intensityCategory,
			fragments: {
				deleteMany: {},
				...(input.fragments?.length
					? {
							create: input.fragments.map(
								({ id: _id, workoutId: _wid, ...f }) => f,
							),
						}
					: {}),
			},
		},
		include: workoutInclude,
	});
	return mapToWorkoutDto(workout);
}
