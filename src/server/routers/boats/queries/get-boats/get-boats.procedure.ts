import { viewerProcedure } from "@/server/procedures";
import { getBoatsInputSchema, getBoatsQuery } from "./get-boats.query";

export const getBoatsProcedure = viewerProcedure
	.input(getBoatsInputSchema.optional())
	.query(({ ctx, input = {} }) => getBoatsQuery(input, ctx));
