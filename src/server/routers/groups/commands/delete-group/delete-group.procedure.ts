import { deleteGroupInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { deleteGroupCommand } from "./delete-group.command";

export const deleteGroupProcedure = adminProcedure
	.input(deleteGroupInputSchema)
	.mutation(({ ctx, input }) => deleteGroupCommand(input, ctx));
