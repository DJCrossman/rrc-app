import { updateBoatSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { updateBoatCommand } from "./update-boat.command";

export const updateBoatProcedure = protectedProcedure
	.input(updateBoatSchema)
	.mutation(({ ctx, input }) => updateBoatCommand(input, ctx));
