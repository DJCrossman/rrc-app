import { viewerProcedure } from "@/server/procedures";
import { getWorkoutsQuery } from "./get-workouts.query";

export const getWorkoutsProcedure = viewerProcedure.query(({ ctx }) =>
	getWorkoutsQuery(undefined, ctx),
);
