import { bulkCreateAthletesSchema } from "@/schemas/athlete.schema";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { bulkCreateAthletesCommand } from "./bulk-create-athletes.command";

export const bulkCreateAthletesProcedure = adminProcedure
	.input(bulkCreateAthletesSchema)
	.mutation(({ ctx, input }) => bulkCreateAthletesCommand(input, ctx));
