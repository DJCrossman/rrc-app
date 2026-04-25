import { protectedProcedure } from "@/server/procedures";
import { syncStravaActivitiesCommand } from "./sync-strava-activities.command";
import { syncStravaActivitiesFinalizeCallback } from "./sync-strava-activities.finalize";

export const syncStravaActivitiesProcedure = protectedProcedure.mutation({
	handler: ({ ctx }) => syncStravaActivitiesCommand(undefined, ctx),
	finalize: syncStravaActivitiesFinalizeCallback,
});
