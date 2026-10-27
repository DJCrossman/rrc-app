import { getGroupByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getGroupByIdQuery } from "./get-group-by-id.query";

export const getGroupByIdProcedure = viewerProcedure
	.input(getGroupByIdInputSchema)
	.query(({ ctx, input }) => getGroupByIdQuery(input, ctx));
