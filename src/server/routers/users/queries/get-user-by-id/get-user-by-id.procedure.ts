import { getUserByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getUserByIdQuery } from "./get-user-by-id.query";

export const getUserByIdProcedure = viewerProcedure
	.input(getUserByIdInputSchema)
	.query(({ ctx, input }) => getUserByIdQuery(input, ctx));
