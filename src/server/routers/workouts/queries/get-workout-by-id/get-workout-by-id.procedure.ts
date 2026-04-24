import { getWorkoutByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getWorkoutByIdQuery } from "./get-workout-by-id.query";

export const getWorkoutByIdProcedure = protectedProcedure
	.input(getWorkoutByIdInputSchema)
	.query(({ ctx, input }) => getWorkoutByIdQuery(input, ctx));
