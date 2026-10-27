import { markUnreadSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { markUnreadCommand } from "./mark-unread.command";

export const markUnreadProcedure = viewerProcedure
	.input(markUnreadSchema)
	.mutation(({ ctx, input }) => markUnreadCommand(input, ctx));
