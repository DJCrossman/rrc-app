import { router } from "@/server/trpc";
import { connectConcept2Procedure } from "./commands/connect-concept2/connect-concept2.procedure";
import { connectStravaProcedure } from "./commands/connect-strava/connect-strava.procedure";
import { createActivityProcedure } from "./commands/create-activity/create-activity.procedure";
import { deleteActivityProcedure } from "./commands/delete-activity/delete-activity.procedure";
import { processConcept2InboxBatchProcedure } from "./commands/process-concept2-inbox-batch/process-concept2-inbox-batch.procedure";
import { processStravaInboxBatchProcedure } from "./commands/process-strava-inbox-batch/process-strava-inbox-batch.procedure";
import { syncConcept2ActivitiesProcedure } from "./commands/sync-concept2-activities/sync-concept2-activities.procedure";
import { syncStravaActivitiesProcedure } from "./commands/sync-strava-activities/sync-strava-activities.procedure";
import { updateActivityProcedure } from "./commands/update-activity/update-activity.procedure";
import { getActivitiesProcedure } from "./queries/get-activities/get-activities.procedure";
import { getActivityByIdProcedure } from "./queries/get-activity-by-id/get-activity-by-id.procedure";
import { getConcept2ResultsProcedure } from "./queries/get-concept2-results/get-concept2-results.procedure";
import { getConcept2UserProcedure } from "./queries/get-concept2-user/get-concept2-user.procedure";
import { getPendingInboxBatchesProcedure } from "./queries/get-pending-inbox-batches/get-pending-inbox-batches.procedure";
import { getStravaActivitiesProcedure } from "./queries/get-strava-activities/get-strava-activities.procedure";
import { getStravaAthleteProcedure } from "./queries/get-strava-athlete/get-strava-athlete.procedure";

export const activitiesRouter = router({
	getActivities: getActivitiesProcedure,
	getActivityById: getActivityByIdProcedure,
	createActivity: createActivityProcedure,
	updateActivity: updateActivityProcedure,
	deleteActivity: deleteActivityProcedure,
	getStravaAthlete: getStravaAthleteProcedure,
	getStravaActivities: getStravaActivitiesProcedure,
	connectStrava: connectStravaProcedure,
	syncStravaActivities: syncStravaActivitiesProcedure,
	getConcept2User: getConcept2UserProcedure,
	getConcept2Results: getConcept2ResultsProcedure,
	connectConcept2: connectConcept2Procedure,
	syncConcept2Activities: syncConcept2ActivitiesProcedure,
	getPendingInboxBatches: getPendingInboxBatchesProcedure,
	processStravaInboxBatch: processStravaInboxBatchProcedure,
	processConcept2InboxBatch: processConcept2InboxBatchProcedure,
});
