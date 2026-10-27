import { getMessagesInputSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { getMessagesQuery } from "./get-messages.query";

export const getMessagesProcedure = viewerProcedure
	.input(getMessagesInputSchema)
	.query(({ ctx, input }) => getMessagesQuery(input, ctx));
