import { createErgSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { createErgCommand } from "./create-erg.command";

export const createErgProcedure = protectedProcedure
	.input(createErgSchema)
	.mutation(({ ctx, input }) => createErgCommand(input, ctx));
