import { router } from "@/server/common/trpc";
import { createActivityAdminProcedure } from "../activities/commands/create-activity/create-activity.admin.procedure";
import { deleteActivityAdminProcedure } from "../activities/commands/delete-activity/delete-activity.admin.procedure";
import { updateActivityAdminProcedure } from "../activities/commands/update-activity/update-activity.admin.procedure";
import { getActivitiesAdminProcedure } from "../activities/queries/get-activities/get-activities.admin.procedure";
import { getActivityByIdAdminProcedure } from "../activities/queries/get-activity-by-id/get-activity-by-id.admin.procedure";

export const adminRouter = router({
	activities: router({
		getActivities: getActivitiesAdminProcedure,
		getActivityById: getActivityByIdAdminProcedure,
		createActivity: createActivityAdminProcedure,
		updateActivity: updateActivityAdminProcedure,
		deleteActivity: deleteActivityAdminProcedure,
	}),
});
