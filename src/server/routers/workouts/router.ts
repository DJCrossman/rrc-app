import { router } from "@/server/trpc";
import { createWorkoutProcedure } from "./commands/create-workout/create-workout.procedure";
import { updateWorkoutProcedure } from "./commands/update-workout/update-workout.procedure";
import { getWorkoutByIdProcedure } from "./queries/get-workout-by-id/get-workout-by-id.procedure";
import { getWorkoutsProcedure } from "./queries/get-workouts/get-workouts.procedure";

export const workoutsRouter = router({
	getWorkouts: getWorkoutsProcedure,
	getWorkoutById: getWorkoutByIdProcedure,
	createWorkout: createWorkoutProcedure,
	updateWorkout: updateWorkoutProcedure,
});
