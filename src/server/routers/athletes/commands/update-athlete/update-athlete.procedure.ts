import { updateAthleteSchema } from "@/schemas/athlete.schema";
import { protectedProcedure } from "@/server/procedures";
import { updateAthleteCommand } from "./update-athlete.command";

export const updateAthleteProcedure = protectedProcedure
	.input(updateAthleteSchema)
	.mutation(({ ctx, input }) => updateAthleteCommand(input, ctx));
