import { getWorkoutByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getWorkoutByIdQuery } from "./get-workout-by-id.query";

export const getWorkoutByIdProcedure = viewerProcedure
	.input(getWorkoutByIdInputSchema)
	.query(({ ctx, input }) => getWorkoutByIdQuery(input, ctx));
