import { createAthleteSchema } from "@/schemas/athlete.schema";
import { protectedProcedure } from "@/server/procedures";
import { createAthleteCommand } from "./create-athlete.command";

export const createAthleteProcedure = protectedProcedure
	.input(createAthleteSchema)
	.mutation(({ ctx, input }) => createAthleteCommand(input, ctx));
