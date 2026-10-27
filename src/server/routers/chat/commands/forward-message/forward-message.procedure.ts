import { forwardMessageSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { forwardMessageCommand } from "./forward-message.command";

export const forwardMessageProcedure = viewerProcedure
	.input(forwardMessageSchema)
	.mutation(({ ctx, input }) => forwardMessageCommand(input, ctx));
