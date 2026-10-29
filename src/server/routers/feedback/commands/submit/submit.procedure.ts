import { submitFeedbackSchema } from "@/schemas";
import { publicProcedure } from "@/server/procedures";
import { submitCommand } from "./submit.command";

export const submitProcedure = publicProcedure
	.input(submitFeedbackSchema)
	.mutation(({ ctx, input }) => submitCommand(input, ctx));
