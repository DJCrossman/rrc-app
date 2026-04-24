import { z } from "zod";
import { envVars } from "@/lib/env";
import { ActivityListScene } from "@/scenes/activities";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	activityId: z.string().optional(),
	action: z.literal("create").optional(),
});

export default async function ActivitiesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { activityId, action } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [
		currentAthlete,
		{ data: activities },
		{ data: boats },
		{ data: ergs },
		{ data: workouts },
		selectedActivity,
	] = await Promise.all([
		caller.athletes.getCurrentAthlete(),
		caller.activities.getActivities({}),
		caller.boats.getBoats(),
		caller.ergs.getErgs(),
		caller.workouts.getWorkouts(),
		caller.activities.getActivityById({ id: activityId }),
	]);

	return (
		<ActivityListScene
			data={activities}
			selectedActivity={selectedActivity}
			currentAthlete={currentAthlete}
			boats={boats}
			ergs={ergs}
			workouts={workouts}
			isCreateDrawerOpen={action === "create"}
			isAIEnabled={envVars.NEXT_PUBLIC_AI_ENABLED}
		/>
	);
}
