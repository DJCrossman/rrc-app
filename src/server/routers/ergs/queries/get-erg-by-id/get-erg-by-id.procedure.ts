import { getErgByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getErgByIdQuery } from "./get-erg-by-id.query";

export const getErgByIdProcedure = viewerProcedure
	.input(getErgByIdInputSchema)
	.query(({ ctx, input }) => getErgByIdQuery(input, ctx));
