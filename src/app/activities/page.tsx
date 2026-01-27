import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";
import {
	createActivity,
	getActivities,
	getActivityById,
	updateActivity,
} from "@/app/api/v1/activities/actions";
import { getAthletes } from "@/app/api/v1/athletes/actions";
import { getBoats } from "@/app/api/v1/boats/actions";
import { getErgs } from "@/app/api/v1/ergs/actions";
import { getWorkouts } from "@/app/api/v1/workouts/actions";
import { routes } from "@/lib/routes";
import { ActivityListScene } from "@/scenes/activities";
import type { CreateActivity, UpdateActivity } from "@/schemas";

const querySchema = z.object({
	activityId: z.coerce.number().optional(),
	action: z.literal("create").optional(),
});

export default async function ActivitiesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { activityId, action } = querySchema.parse(await searchParams);
	const { data: activities } = await getActivities({});
	const { data: athletes } = await getAthletes();
	const { data: boats } = await getBoats();
	const { data: ergs } = await getErgs();
	const { data: workouts } = await getWorkouts();
	const selectedActivity = await getActivityById(activityId);

	return (
		<ActivityListScene
			data={activities}
			selectedActivity={selectedActivity}
			athletes={athletes}
			boats={boats}
			ergs={ergs}
			workouts={workouts}
			isCreateDrawerOpen={action === "create"}
			onCreateActivity={async (activity: CreateActivity) => {
				"use server";
				await createActivity(activity);
				redirect(routes.activities.list(), RedirectType.push);
			}}
			onUpdateActivity={async (activity: UpdateActivity) => {
				"use server";
				await updateActivity(activity);
			}}
		/>
	);
}
