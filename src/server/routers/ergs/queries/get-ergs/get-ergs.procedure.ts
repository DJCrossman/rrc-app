import { protectedProcedure } from "@/server/procedures";
import { getErgsInputSchema, getErgsQuery } from "./get-ergs.query";

export const getErgsProcedure = protectedProcedure
	.input(getErgsInputSchema.optional())
	.query(({ ctx, input = {} }) => getErgsQuery(input, ctx));
