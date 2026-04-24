import { deleteErgInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { deleteErgCommand } from "./delete-erg.command";

export const deleteErgProcedure = protectedProcedure
	.input(deleteErgInputSchema)
	.mutation(({ ctx, input }) => deleteErgCommand(input, ctx));
