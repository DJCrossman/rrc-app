import { router } from "@/server/trpc";
import { getStravaActivitiesProcedure } from "./queries/get-strava-activities/get-strava-activities.procedure";
import { getStravaAthleteProcedure } from "./queries/get-strava-athlete/get-strava-athlete.procedure";

export const stravaRouter = router({
	getStravaAthlete: getStravaAthleteProcedure,
	getStravaActivities: getStravaActivitiesProcedure,
});
