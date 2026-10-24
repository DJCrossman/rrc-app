import { unsubscribeFromPushSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { unsubscribeCommand } from "./unsubscribe.command";

export const unsubscribeProcedure = protectedProcedure
	.input(unsubscribeFromPushSchema)
	.mutation(({ ctx, input }) => unsubscribeCommand(input, ctx));
