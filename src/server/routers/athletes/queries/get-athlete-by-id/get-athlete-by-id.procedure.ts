import { getAthleteByIdInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getAthleteByIdQuery } from "./get-athlete-by-id.query";

export const getAthleteByIdProcedure = protectedProcedure
	.input(getAthleteByIdInputSchema)
	.query(({ ctx, input }) => getAthleteByIdQuery(input, ctx));
