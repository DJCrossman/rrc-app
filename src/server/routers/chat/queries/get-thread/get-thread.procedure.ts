import { getThreadInputSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { getThreadQuery } from "./get-thread.query";

export const getThreadProcedure = viewerProcedure
	.input(getThreadInputSchema)
	.query(({ ctx, input }) => getThreadQuery(input, ctx));
