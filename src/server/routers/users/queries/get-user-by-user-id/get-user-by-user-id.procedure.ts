import { getUserByUserIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getUserByUserIdQuery } from "./get-user-by-user-id.query";

export const getUserByUserIdProcedure = protectedProcedure
	.input(getUserByUserIdInputSchema)
	.query(({ ctx, input }) => getUserByUserIdQuery(input, ctx));
