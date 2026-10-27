import { viewerProcedure } from "@/server/procedures";
import { getErgsInputSchema, getErgsQuery } from "./get-ergs.query";

export const getErgsProcedure = viewerProcedure
	.input(getErgsInputSchema.optional())
	.query(({ ctx, input = {} }) => getErgsQuery(input, ctx));
