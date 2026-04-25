import { connectConcept2InputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { connectConcept2Command } from "./connect-concept2.command";

export const connectConcept2Procedure = protectedProcedure
	.input(connectConcept2InputSchema)
	.mutation(({ ctx, input }) => connectConcept2Command(input, ctx));
