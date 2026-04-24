import { updateWorkoutSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { updateWorkoutCommand } from "./update-workout.command";

export const updateWorkoutProcedure = protectedProcedure
	.input(updateWorkoutSchema)
	.mutation(({ ctx, input }) => updateWorkoutCommand(input, ctx));
