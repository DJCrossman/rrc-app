import { updateBoatSchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { updateBoatCommand } from "./update-boat.command";

export const updateBoatProcedure = adminProcedure
	.input(updateBoatSchema)
	.mutation(({ ctx, input }) => updateBoatCommand(input, ctx));
