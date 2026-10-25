import { createGroupSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { createGroupCommand } from "./create-group.command";

export const createGroupProcedure = adminProcedure
	.input(createGroupSchema)
	.mutation(({ ctx, input }) => createGroupCommand(input, ctx));
