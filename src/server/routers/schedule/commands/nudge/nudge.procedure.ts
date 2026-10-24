import { eventIdInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { nudgeCommand } from "./nudge.command";

export const nudgeProcedure = adminProcedure
	.input(eventIdInputSchema)
	.mutation(({ ctx, input }) => nudgeCommand(input, ctx));
