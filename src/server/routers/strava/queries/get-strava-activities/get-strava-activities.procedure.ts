import { getStravaActivitiesInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getStravaActivitiesQuery } from "./get-strava-activities.query";

export const getStravaActivitiesProcedure = protectedProcedure
	.input(getStravaActivitiesInputSchema.optional())
	.query(({ ctx, input }) => getStravaActivitiesQuery(input ?? {}, ctx));
