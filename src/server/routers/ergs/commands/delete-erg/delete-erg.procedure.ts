import { deleteErgInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { deleteErgCommand } from "./delete-erg.command";

export const deleteErgProcedure = adminProcedure
	.input(deleteErgInputSchema)
	.mutation(({ ctx, input }) => deleteErgCommand(input, ctx));
