import { getUserByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getUserByIdQuery } from "./get-user-by-id.query";

export const getUserByIdProcedure = protectedProcedure
	.input(getUserByIdInputSchema)
	.query(({ ctx, input }) => getUserByIdQuery(input, ctx));
