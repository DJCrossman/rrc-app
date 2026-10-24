import { subscribeToPushSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { subscribeCommand } from "./subscribe.command";

export const subscribeProcedure = protectedProcedure
	.input(subscribeToPushSchema)
	.mutation(({ ctx, input }) => subscribeCommand(input, ctx));
