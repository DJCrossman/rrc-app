import { leaveDmSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { leaveDmCommand } from "./leave-dm.command";

export const leaveDmProcedure = viewerProcedure
	.input(leaveDmSchema)
	.mutation(({ ctx, input }) => leaveDmCommand(input, ctx));
