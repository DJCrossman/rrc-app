import { createBoatSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { createBoatCommand } from "./create-boat.command";

export const createBoatProcedure = protectedProcedure
	.input(createBoatSchema)
	.mutation(({ ctx, input }) => createBoatCommand(input, ctx));
