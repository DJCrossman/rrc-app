import { protectedProcedure } from "@/server/procedures";
import { getBoatsInputSchema, getBoatsQuery } from "./get-boats.query";

export const getBoatsProcedure = protectedProcedure
	.input(getBoatsInputSchema.optional())
	.query(({ ctx, input = {} }) => getBoatsQuery(input, ctx));
