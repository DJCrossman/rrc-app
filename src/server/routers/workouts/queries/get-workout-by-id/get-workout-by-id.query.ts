import type { GetWorkoutByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "@/server/routers/workouts/common/map-to-workout-dto";

export async function getWorkoutByIdQuery(
	input: GetWorkoutByIdInput,
	{ db }: Context,
) {
	const workout = await db.workout.findUnique({
		where: { id: input.id },
		include: workoutInclude,
	});
	return workout ? mapToWorkoutDto(workout) : null;
}
