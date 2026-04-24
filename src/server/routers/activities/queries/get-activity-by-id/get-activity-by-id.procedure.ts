import { getActivityByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getActivityByIdQuery } from "./get-activity-by-id.query";

export const getActivityByIdProcedure = protectedProcedure
	.input(getActivityByIdInputSchema)
	.query(({ ctx, input }) => getActivityByIdQuery(input, ctx));
