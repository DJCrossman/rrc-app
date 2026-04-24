import { getBoatByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getBoatByIdQuery } from "./get-boat-by-id.query";

export const getBoatByIdProcedure = protectedProcedure
	.input(getBoatByIdInputSchema)
	.query(({ ctx, input }) => getBoatByIdQuery(input, ctx));
