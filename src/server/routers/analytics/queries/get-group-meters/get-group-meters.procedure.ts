import { getGroupByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getGroupMetersQuery } from "./get-group-meters.query";

export const getGroupMetersProcedure = viewerProcedure
	.input(getGroupByIdInputSchema)
	.query(({ ctx, input }) => getGroupMetersQuery(input, ctx));
