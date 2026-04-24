import { protectedProcedure } from "@/server/procedures";
import { getWorkoutsQuery } from "./get-workouts.query";

export const getWorkoutsProcedure = protectedProcedure.query(({ ctx }) =>
	getWorkoutsQuery(undefined, ctx),
);
