import { getStravaAthleteInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getStravaAthleteQuery } from "./get-strava-athlete.query";

export const getStravaAthleteProcedure = protectedProcedure
	.input(getStravaAthleteInputSchema.optional())
	.query(({ ctx, input }) => getStravaAthleteQuery(input ?? {}, ctx));
