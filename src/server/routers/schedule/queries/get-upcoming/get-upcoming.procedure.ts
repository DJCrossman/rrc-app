import { getUpcomingInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { canViewGroupScope } from "@/server/routers/groups/common";
import { getUpcomingQuery } from "./get-upcoming.query";

export const getUpcomingProcedure = viewerProcedure
	.input(getUpcomingInputSchema)
	.permission(canViewGroupScope)
	.query(({ ctx, input }) => getUpcomingQuery(input, ctx));
