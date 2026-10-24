import { DateTime } from "luxon";
import { CLUB_TIMEZONE } from "@/lib/schedule/week";
import type { ScheduleEvent } from "@/lib/trpc/types";
import type { EventFormInput } from "@/schemas";

export function getNewEventFormValues(date: string): EventFormInput {
	const month = DateTime.fromISO(date).month;
	return {
		type: "training",
		title: "",
		description: "",
		date,
		allDay: false,
		startTime: "06:00",
		endTime: "07:30",
		timezone: CLUB_TIMEZONE,
		location: "",
		audience: "club",
		groupIds: [],
		volunteerSpots: null,
		workout: {
			description: "",
			activityType: month >= 5 && month <= 9 ? "water" : "erg",
			workoutType: "time",
			elapsedTime: null,
			distance: null,
			intervalCount: 1,
			intensityCategory: "C6",
			fragments: [],
		},
	};
}

export function getEventFormValues(event: ScheduleEvent): EventFormInput {
	const toTime = (iso: string | null) =>
		iso
			? DateTime.fromISO(iso, { zone: event.timezone }).toFormat("HH:mm")
			: "";
	const defaults = getNewEventFormValues(event.date);
	return {
		...defaults,
		type: event.type,
		title: event.title,
		description: event.description ?? "",
		allDay: event.allDay,
		startTime: event.allDay ? "" : toTime(event.startAt),
		endTime: event.allDay ? "" : toTime(event.endAt),
		timezone: event.timezone,
		location: event.location ?? "",
		audience: event.audience,
		groupIds: event.groupIds,
		volunteerSpots: event.volunteerSpots,
		workout: event.workout
			? {
					description: event.workout.description,
					activityType: event.workout.activityType,
					workoutType: event.workout.workoutType,
					elapsedTime: event.workout.elapsedTime,
					distance: event.workout.distance,
					intervalCount: event.workout.intervalCount,
					intensityCategory: event.workout.intensityCategory,
					fragments: event.workout.fragments.map((fragment) => ({
						rate: fragment.rate ?? undefined,
						elapsedTime: fragment.elapsedTime ?? undefined,
						distance: fragment.distance ?? undefined,
						relativeTo: fragment.relativeTo as "2K" | "6K",
						relativeSplit: fragment.relativeSplit,
					})),
				}
			: defaults.workout,
	};
}
