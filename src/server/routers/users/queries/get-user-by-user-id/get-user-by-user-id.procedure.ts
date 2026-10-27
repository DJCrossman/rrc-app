import { getUserByUserIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getUserByUserIdQuery } from "./get-user-by-user-id.query";

export const getUserByUserIdProcedure = viewerProcedure
	.input(getUserByUserIdInputSchema)
	.query(({ ctx, input }) => getUserByUserIdQuery(input, ctx));
