import { updateGroupSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { updateGroupCommand } from "./update-group.command";

export const updateGroupProcedure = adminProcedure
	.input(updateGroupSchema)
	.mutation(({ ctx, input }) => updateGroupCommand(input, ctx));
