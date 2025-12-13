import { DateTime } from "luxon";
import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";
import {
	createWorkout,
	getWorkoutById,
	getWorkouts,
	updateWorkout,
} from "@/app/api/v1/workouts/actions";
import { routes } from "@/lib/routes";
import { WorkoutListScene } from "@/scenes/workouts";
import type { CreateWorkout, Workout } from "@/schemas";

const querySchema = z.object({
	workoutId: z.coerce.number().optional(),
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

	const { data } = await getWorkouts();
	const selectedWorkout = workoutId ? await getWorkoutById(workoutId) : null;

	return (
		<WorkoutListScene
			data={data}
			selectedWorkout={selectedWorkout}
			currentWeekIsoDate={week}
			isCreateDrawerOpen={action === "create"}
			onCreateWorkout={async (workout: CreateWorkout) => {
				"use server";
				await createWorkout(workout);
				redirect(routes.workouts.list(), RedirectType.push);
			}}
			onUpdateWorkout={async (workout: Workout) => {
				"use server";
				await updateWorkout(workout);
			}}
		/>
	);
}
