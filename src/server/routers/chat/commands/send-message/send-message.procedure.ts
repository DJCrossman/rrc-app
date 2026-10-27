import { sendMessageSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { sendMessageCommand } from "./send-message.command";

export const sendMessageProcedure = viewerProcedure
	.input(sendMessageSchema)
	.mutation(({ ctx, input }) => sendMessageCommand(input, ctx));
