import { createActivitySchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { createActivityCommand } from "./create-activity.command";

export const createActivityProcedure = protectedProcedure
	.input(createActivitySchema)
	.mutation(({ ctx, input }) => createActivityCommand(input, ctx));
