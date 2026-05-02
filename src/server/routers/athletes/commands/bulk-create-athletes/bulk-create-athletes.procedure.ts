import { bulkCreateAthletesSchema } from "@/schemas/athlete.schema";
import { protectedProcedure } from "@/server/procedures";
import { bulkCreateAthletesCommand } from "./bulk-create-athletes.command";

export const bulkCreateAthletesProcedure = protectedProcedure
	.input(bulkCreateAthletesSchema)
	.mutation(({ ctx, input }) => bulkCreateAthletesCommand(input, ctx));
