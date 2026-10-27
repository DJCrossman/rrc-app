import { markReadSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { markReadCommand } from "./mark-read.command";

export const markReadProcedure = viewerProcedure
	.input(markReadSchema)
	.mutation(({ ctx, input }) => markReadCommand(input, ctx));
