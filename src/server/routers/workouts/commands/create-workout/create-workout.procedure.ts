import { workoutCoreSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { createWorkoutCommand } from "./create-workout.command";

export const createWorkoutProcedure = protectedProcedure
	.input(workoutCoreSchema)
	.mutation(({ ctx, input }) => createWorkoutCommand(input, ctx));
