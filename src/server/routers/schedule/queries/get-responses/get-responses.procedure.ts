import { eventIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getResponsesQuery } from "./get-responses.query";

export const getResponsesProcedure = viewerProcedure
	.input(eventIdInputSchema)
	.query(({ ctx, input }) => getResponsesQuery(input, ctx));
