import { updateAthleteSchema } from "@/schemas/athlete.schema";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { updateAthleteCommand } from "./update-athlete.command";

export const updateAthleteProcedure = adminProcedure
	.input(updateAthleteSchema)
	.mutation(({ ctx, input }) => updateAthleteCommand(input, ctx));
