import { DateTime } from "luxon";
import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";
import {
	createWorkout,
	getWorkoutById,
	getWorkouts,
	updateWorkout,
	uploadWorkoutScreenshot,
} from "@/app/api/v1/workouts/actions";
import { envVars } from "@/lib/env";
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
			onCreateWorkouts={async ({ workouts }: { workouts: CreateWorkout[] }) => {
				"use server";
				const week = DateTime.fromISO(workouts[0].startDate);
				for (const workout of workouts) {
					await createWorkout(workout);
				}
				redirect(
					routes.workouts.list({ week: week.isValid ? week : undefined }),
					RedirectType.push,
				);
			}}
			onUpdateWorkout={async (workout: Workout) => {
				"use server";
				await updateWorkout(workout);
			}}
			onUploadWorkoutScreenshot={
				envVars.NEXT_PUBLIC_AI_ENABLED
					? async (file: File) => {
							"use server";
							return await uploadWorkoutScreenshot(file);
						}
					: undefined
			}
		/>
	);
}
