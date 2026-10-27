import type { Prisma } from "@/generated/prisma/client";
import type { ZoneMinutes } from "@/schemas";

export const workoutInclude = {
	fragments: true,
	zoneMinutes: true,
	event: { select: { id: true, title: true } },
} as const;

export type WorkoutRow = Prisma.workoutGetPayload<{
	include: typeof workoutInclude;
}>;

export const mapToWorkoutDto = (workout: WorkoutRow) => ({
	id: workout.id,
	description: workout.description,
	startDate: workout.startDate.toISOString(),
	workoutType: workout.workoutType,
	activityType: workout.activityType,
	elapsedTime: workout.elapsedTime,
	distance: workout.distance,
	intervalCount: workout.intervalCount,
	intensityCategory: workout.intensityCategory,
	zoneMinutes: mapToZoneMinutes(workout.zoneMinutes),
	eventId: workout.event?.id ?? null,
	eventTitle: workout.event?.title ?? null,
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

const mapToZoneMinutes = (rows: WorkoutRow["zoneMinutes"]): ZoneMinutes =>
	Object.fromEntries(
		rows.map((row) => [row.intensityCategory, row.minutes]),
	) as ZoneMinutes;
