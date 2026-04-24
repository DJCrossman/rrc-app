import { DateTime } from "luxon";
import { z } from "zod";
import { envVars } from "@/lib/env";
import { WorkoutListScene } from "@/scenes/workouts";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	workoutId: z.string().optional(),
	action: z.literal("create").optional(),
	week: z
		.string()
		.optional()
		.default(DateTime.now().startOf("week").minus({ days: 1 }).toISODate()),
});

export default async function WorkoutsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { workoutId, action, week } = querySchema.parse(await searchParams);
	const caller = await createServerCaller();
	const [{ data }, selectedWorkout, { analyticMetrics }] = await Promise.all([
		caller.workouts.getWorkouts(),
		workoutId ? caller.workouts.getWorkoutById({ id: workoutId }) : null,
		caller.analytics.getAnalytics(),
	]);

	return (
		<WorkoutListScene
			data={data}
			selectedWorkout={selectedWorkout}
			currentWeekIsoDate={week}
			isCreateDrawerOpen={action === "create"}
			analyticMetrics={analyticMetrics}
			isAIEnabled={envVars.NEXT_PUBLIC_AI_ENABLED}
		/>
	);
}
