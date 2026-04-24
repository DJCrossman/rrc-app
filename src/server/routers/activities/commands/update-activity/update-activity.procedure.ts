import { updateActivitySchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { updateActivityCommand } from "./update-activity.command";

export const updateActivityProcedure = protectedProcedure
	.input(updateActivitySchema)
	.mutation(({ ctx, input }) => updateActivityCommand(input, ctx));
