import { RedirectType, redirect } from "next/navigation";
import { createWorkout } from "@/app/api/v1/workouts/actions";
import { routes } from "@/lib/routes";
import { WorkoutCreateScene } from "@/scenes/workouts";
import type { CreateWorkout } from "@/schemas";

export default function CreateWorkoutPage() {
	const handleSubmit = async (workout: CreateWorkout) => {
		"use server";
		await createWorkout(workout);
		redirect(routes.workouts.list(), RedirectType.push);
	};

	return <WorkoutCreateScene onSubmit={handleSubmit} />;
}
