import { router } from "@/server/trpc";
import { createActivityProcedure } from "./commands/create-activity/create-activity.procedure";
import { deleteActivityProcedure } from "./commands/delete-activity/delete-activity.procedure";
import { updateActivityProcedure } from "./commands/update-activity/update-activity.procedure";
import { getActivitiesProcedure } from "./queries/get-activities/get-activities.procedure";
import { getActivityByIdProcedure } from "./queries/get-activity-by-id/get-activity-by-id.procedure";

export const activitiesRouter = router({
	getActivities: getActivitiesProcedure,
	getActivityById: getActivityByIdProcedure,
	createActivity: createActivityProcedure,
	updateActivity: updateActivityProcedure,
	deleteActivity: deleteActivityProcedure,
});
