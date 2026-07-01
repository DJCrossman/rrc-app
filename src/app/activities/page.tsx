import { z } from "zod";
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
		[currentAthleteResult, activitiesResult, selectedActivityResult],
		{ data: boats },
		{ data: ergs },
		{ data: workouts },
	] = await Promise.all([
		Promise.allSettled([
			caller.athletes.getCurrentAthlete(),
			caller.activities.getActivities(),
			caller.activities.getActivityById({ id: activityId }),
		]),
		caller.boats.getBoats(),
		caller.ergs.getErgs(),
		caller.workouts.getWorkouts(),
	]);

	const currentAthlete =
		currentAthleteResult.status === "fulfilled"
			? currentAthleteResult.value
			: undefined;
	const activitiesResponse =
		activitiesResult.status === "fulfilled"
			? activitiesResult.value
			: undefined;
	const selectedActivity =
		selectedActivityResult.status === "fulfilled"
			? (selectedActivityResult.value ?? undefined)
			: undefined;

	return (
		<ActivityListScene
			initialData={activitiesResponse}
			selectedActivity={selectedActivity}
			currentAthlete={currentAthlete}
			boats={boats}
			ergs={ergs}
			workouts={workouts}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
