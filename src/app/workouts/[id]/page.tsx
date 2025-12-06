import { notFound } from "next/navigation";
import { getWorkoutById, updateWorkout } from "@/app/api/v1/workouts/actions";
import { WorkoutDetailsScene } from "@/scenes/workouts";
import type { Workout } from "@/schemas";

interface WorkoutDetailsPageProps {
	params: Promise<{ id: string }>;
}

export default async function WorkoutDetailsPage({
	params,
}: WorkoutDetailsPageProps) {
	const { id } = await params;
	const workout = await getWorkoutById(Number(id));

	const handleSubmit = async (workout: Workout) => {
		"use server";
		await updateWorkout(workout);
	};

	if (!workout) {
		notFound();
	}

	return <WorkoutDetailsScene workout={workout} onSubmit={handleSubmit} />;
}
