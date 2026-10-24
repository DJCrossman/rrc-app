import type { CreateEvent, EventWorkout } from "@/schemas";

export function toEventData(input: CreateEvent) {
	return {
		type: input.type,
		title: input.title,
		description: input.description || null,
		startAt: new Date(input.startAt),
		endAt: input.endAt ? new Date(input.endAt) : null,
		allDay: input.allDay,
		timezone: input.timezone,
		location: input.location || null,
		audience: input.audience,
		volunteerSpots:
			input.type === "volunteer" ? (input.volunteerSpots ?? null) : null,
	};
}

export function toEventGroups(input: CreateEvent) {
	const groupIds =
		input.audience === "groups" ? [...new Set(input.groupIds)] : [];
	return groupIds.map((groupId) => ({ groupId }));
}

export function toWorkoutData(workout: EventWorkout, startAt: string) {
	return {
		description: workout.description,
		startDate: new Date(startAt),
		workoutType: workout.workoutType,
		activityType: workout.activityType,
		elapsedTime: workout.elapsedTime ?? null,
		distance: workout.distance ?? null,
		intervalCount: workout.intervalCount ?? 1,
		intensityCategory: workout.intensityCategory,
	};
}
