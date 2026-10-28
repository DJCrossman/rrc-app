import type { ParsedPromptEvent } from "@/app/api/v1/events/parse-prompt/route";
import type { ParseDescriptionResult } from "@/app/api/v1/workouts/parse-description/route";
import type { EventFormInput } from "@/schemas";
import { getNewEventFormValues } from "./getEventFormValues";

export function getPromptEventFormValues(
	event: ParsedPromptEvent,
	parsedWorkout?: ParseDescriptionResult,
): EventFormInput {
	const defaults = getNewEventFormValues(event.date);
	const allDay = event.allDay && !event.startTime;
	const startTime = allDay ? "" : (event.startTime ?? defaults.startTime);
	const endTime =
		allDay || !event.endTime || event.endTime <= startTime ? "" : event.endTime;
	return {
		...defaults,
		type: event.type,
		title: event.title,
		allDay,
		startTime,
		endTime,
		location: event.location ?? "",
		volunteerSpots:
			event.type === "volunteer" ? (event.volunteerSpots ?? 1) : null,
		hasWorkout: event.type === "training" && !!event.workout,
		workout: event.workout
			? {
					...defaults.workout,
					...event.workout,
					workoutType: parsedWorkout ? getWorkoutType(parsedWorkout) : "other",
					elapsedTime: parsedWorkout?.elapsedTime ?? null,
					distance: parsedWorkout?.distance ?? null,
					intervalCount: parsedWorkout?.intervalCount ?? 1,
					fragments: parsedWorkout?.fragments ?? [],
				}
			: defaults.workout,
	};
}

// A time or distance workout the model couldn't measure would fail the form's
// validation, so it falls back to "other" rather than dropping the event.
function getWorkoutType({
	workoutType,
	elapsedTime,
	distance,
}: ParseDescriptionResult): EventFormInput["workout"]["workoutType"] {
	if (workoutType === "time" && !elapsedTime) return "other";
	if (workoutType === "distance" && !distance) return "other";
	return workoutType;
}
