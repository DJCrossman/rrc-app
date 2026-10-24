import { getUpcomingInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getUpcomingQuery } from "./get-upcoming.query";

export const getUpcomingProcedure = viewerProcedure
	.input(getUpcomingInputSchema)
	.query(({ ctx, input }) => getUpcomingQuery(input, ctx));
