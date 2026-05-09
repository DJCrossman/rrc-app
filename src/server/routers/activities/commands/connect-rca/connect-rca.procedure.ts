import { connectRcaInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { connectRcaCommand } from "./connect-rca.command";

export const connectRcaProcedure = protectedProcedure
	.input(connectRcaInputSchema)
	.mutation(({ ctx, input }) => connectRcaCommand(input, ctx));
