import { z } from "zod";
import { ActivityListScene } from "@/scenes/activities";
import { createServerCaller } from "@/server/caller";
import { createTRPCContext } from "@/server/context";

const querySchema = z.object({
	activityId: z.string().optional(),
	action: z.literal("create").optional(),
	athleteIds: z
		.string()
		.transform((value) => value.split(",").filter(Boolean))
		.optional(),
});

export default async function ActivitiesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { activityId, action, athleteIds } = querySchema.parse(
		await searchParams,
	);
	const caller = await createServerCaller();
	const { user } = await createTRPCContext();

	const [
		[currentAthleteResult, activitiesResult, selectedActivityResult],
		{ data: boats },
		{ data: ergs },
		{ data: workouts },
		{ data: athletes },
	] = await Promise.all([
		Promise.allSettled([
			caller.athletes.getCurrentAthlete(),
			caller.activities.getActivities({ athleteIds }),
			caller.activities.getActivityById({ id: activityId }),
		]),
		caller.boats.getBoats(),
		caller.ergs.getErgs(),
		caller.workouts.getWorkouts(),
		user?.isAdmin
			? caller.athletes.getAthletes({ pageSize: 200 })
			: Promise.resolve({ data: undefined }),
	]);

	const currentAthlete =
		currentAthleteResult.status === "fulfilled"
			? (currentAthleteResult.value ?? undefined)
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
			athletes={athletes}
			athleteIds={athleteIds}
			selectedActivity={selectedActivity}
			currentAthlete={currentAthlete}
			boats={boats}
			ergs={ergs}
			workouts={workouts}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
