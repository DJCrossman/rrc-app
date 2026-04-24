import { updateErgSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { updateErgCommand } from "./update-erg.command";

export const updateErgProcedure = protectedProcedure
	.input(updateErgSchema)
	.mutation(({ ctx, input }) => updateErgCommand(input, ctx));
