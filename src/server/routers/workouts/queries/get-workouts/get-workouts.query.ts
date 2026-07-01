import { paginate } from "@/lib/pagination";
import type { Context } from "@/server/context";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "@/server/routers/workouts/common/map-to-workout-dto";

export async function getWorkoutsQuery(_input: undefined, { db }: Context) {
	const [workouts, totalCount] = await Promise.all([
		db.workout.findMany({
			orderBy: { startDate: "desc" },
			include: workoutInclude,
		}),
		db.workout.count(),
	]);

	return paginate({
		data: workouts.map(mapToWorkoutDto),
		totalCount,
	});
}
