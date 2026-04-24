import type { Prisma } from "@/generated/prisma/client";

export const workoutInclude = { fragments: true } as const;

export type WorkoutRow = Prisma.workoutGetPayload<{
	include: typeof workoutInclude;
}>;

export const mapToWorkoutDto = (workout: WorkoutRow) => ({
	id: workout.id,
	description: workout.description,
	startDate: workout.startDate.toISOString(),
	workoutType: workout.workoutType,
	elapsedTime: workout.elapsedTime,
	distance: workout.distance,
	intervalCount: workout.intervalCount,
	intensityCategory: workout.intensityCategory,
	fragments: workout.fragments.map((f) => ({
		id: f.id,
		workoutId: f.workoutId,
		rate: f.rate,
		elapsedTime: f.elapsedTime,
		distance: f.distance,
		relativeTo: f.relativeTo,
		relativeSplit: f.relativeSplit,
	})),
});
