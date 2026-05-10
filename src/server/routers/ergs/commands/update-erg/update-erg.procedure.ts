import { updateErgSchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { updateErgCommand } from "./update-erg.command";

export const updateErgProcedure = adminProcedure
	.input(updateErgSchema)
	.mutation(({ ctx, input }) => updateErgCommand(input, ctx));
