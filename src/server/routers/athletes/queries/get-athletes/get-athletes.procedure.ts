import { protectedProcedure } from "@/server/procedures";
import { getAthletesInputSchema, getAthletesQuery } from "./get-athletes.query";

export const getAthletesProcedure = protectedProcedure
	.input(getAthletesInputSchema.optional())
	.query(({ ctx, input = {} }) => getAthletesQuery(input, ctx));
