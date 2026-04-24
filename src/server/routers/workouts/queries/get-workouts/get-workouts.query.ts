import type { Context } from "@/server/context";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "@/server/routers/workouts/common/map-to-workout-dto";

export async function getWorkoutsQuery(_input: undefined, { db }: Context) {
	const workouts = await db.workout.findMany({
		orderBy: { startDate: "desc" },
		include: workoutInclude,
	});
	return { data: workouts.map(mapToWorkoutDto) };
}
