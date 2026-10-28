import { getGroupByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { canViewGroup } from "@/server/routers/groups/common";
import { getGroupMetersQuery } from "./get-group-meters.query";

export const getGroupMetersProcedure = viewerProcedure
	.input(getGroupByIdInputSchema)
	.permission(canViewGroup)
	.query(({ ctx, input }) => getGroupMetersQuery(input, ctx));
