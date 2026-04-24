import { deleteActivityInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { deleteActivityCommand } from "./delete-activity.command";

export const deleteActivityProcedure = protectedProcedure
	.input(deleteActivityInputSchema)
	.mutation(({ ctx, input }) => deleteActivityCommand(input, ctx));
