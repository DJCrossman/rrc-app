import { getGroupByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getGroupByIdQuery } from "./get-group-by-id.query";

export const getGroupByIdProcedure = protectedProcedure
	.input(getGroupByIdInputSchema)
	.query(({ ctx, input }) => getGroupByIdQuery(input, ctx));
