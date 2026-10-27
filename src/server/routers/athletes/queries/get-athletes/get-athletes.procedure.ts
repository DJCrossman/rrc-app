import { viewerProcedure } from "@/server/procedures";
import { getAthletesInputSchema, getAthletesQuery } from "./get-athletes.query";

export const getAthletesProcedure = viewerProcedure
	.input(getAthletesInputSchema.optional())
	.query(({ ctx, input = {} }) => getAthletesQuery(input, ctx));
