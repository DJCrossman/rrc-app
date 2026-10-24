import { getWeekInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getWeekQuery } from "./get-week.query";

export const getWeekProcedure = viewerProcedure
	.input(getWeekInputSchema)
	.query(({ ctx, input }) => getWeekQuery(input, ctx));
