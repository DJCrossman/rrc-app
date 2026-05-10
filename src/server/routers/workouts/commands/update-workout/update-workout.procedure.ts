import { updateWorkoutSchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { updateWorkoutCommand } from "./update-workout.command";

export const updateWorkoutProcedure = adminProcedure
	.input(updateWorkoutSchema)
	.mutation(({ ctx, input }) => updateWorkoutCommand(input, ctx));
