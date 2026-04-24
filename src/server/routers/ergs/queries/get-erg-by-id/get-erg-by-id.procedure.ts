import { getErgByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getErgByIdQuery } from "./get-erg-by-id.query";

export const getErgByIdProcedure = protectedProcedure
	.input(getErgByIdInputSchema)
	.query(({ ctx, input }) => getErgByIdQuery(input, ctx));
