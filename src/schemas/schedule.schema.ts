import { DateTime, IANAZone } from "luxon";
import { z } from "zod";
import { CLUB_TIMEZONE } from "@/lib/schedule/week";
import {
	createWorkoutFragmentSchema,
	workoutCoreSchema,
} from "./workouts.schema";

export const EventTypes = ["training", "regatta", "volunteer"] as const;
export type EventType = (typeof EventTypes)[number];

export const EventAudiences = ["club", "groups"] as const;
export type EventAudience = (typeof EventAudiences)[number];

export const RsvpStatuses = ["yes", "maybe", "no"] as const;
export type RsvpStatus = (typeof RsvpStatuses)[number];

export const ScheduleTypeFilters = [
	"all",
	"training",
	"regatta",
	"volunteer",
] as const;
export type ScheduleTypeFilter = (typeof ScheduleTypeFilters)[number];

export const getWeekInputSchema = z.object({
	weekStart: z.iso.date(),
	type: z.enum(EventTypes).optional(),
	groupId: z.string().min(1).optional(),
});
export type GetWeekInput = z.infer<typeof getWeekInputSchema>;

export const getEventByIdInputSchema = z.object({ id: z.string() });
export type GetEventByIdInput = z.infer<typeof getEventByIdInputSchema>;

export const eventIdInputSchema = z.object({ eventId: z.string() });
export type EventIdInput = z.infer<typeof eventIdInputSchema>;

export const getUpcomingInputSchema = z.object({
	limit: z.number().int().min(1).max(50).default(5),
	groupId: z.string().min(1).optional(),
});
export type GetUpcomingInput = z.infer<typeof getUpcomingInputSchema>;

export const rsvpInputSchema = z.object({
	eventId: z.string(),
	status: z.enum(RsvpStatuses).nullable(),
});
export type RsvpInput = z.infer<typeof rsvpInputSchema>;

export const eventWorkoutSchema = workoutCoreSchema.omit({ startDate: true });
export type EventWorkout = z.infer<typeof eventWorkoutSchema>;

const eventFieldsSchema = z.object({
	type: z.enum(EventTypes),
	title: z.string().trim().min(1, "Title is required").max(200),
	description: z.string().trim().max(5000).nullish(),
	startAt: z.iso.datetime({ offset: true }),
	endAt: z.iso.datetime({ offset: true }).nullish(),
	allDay: z.boolean().default(false),
	timezone: z
		.string()
		.refine((zone) => IANAZone.isValidZone(zone), "Unknown timezone")
		.default(CLUB_TIMEZONE),
	location: z.string().trim().max(200).nullish(),
	audience: z.enum(EventAudiences).default("club"),
	groupIds: z.array(z.string().trim().min(1)).default([]),
	volunteerSpots: z.number().int().nullish(),
	workout: eventWorkoutSchema.nullish(),
});

export const createEventSchema = eventFieldsSchema.superRefine(refineEvent);
export type CreateEvent = z.infer<typeof createEventSchema>;

export const updateEventSchema = eventFieldsSchema
	.extend({ id: z.string() })
	.superRefine(refineEvent);
export type UpdateEvent = z.infer<typeof updateEventSchema>;

// Whether a change should push to the athletes it affects. On by default; the
// coach can untick it for edits nobody needs to hear about.
const notifySchema = z.object({ notify: z.boolean().default(true) });

export const updateEventInputSchema = updateEventSchema.and(notifySchema);
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

export const deleteEventInputSchema = z
	.object({ id: z.string() })
	.extend(notifySchema.shape);
export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;

export const eventFormSchema = z
	.object({
		type: z.enum(EventTypes),
		title: z.string().trim().min(1, "Title is required"),
		description: z.string(),
		date: z.iso.date({ message: "Date is required" }),
		allDay: z.boolean(),
		startTime: z.string(),
		endTime: z.string(),
		timezone: z.string(),
		location: z.string(),
		audience: z.enum(EventAudiences),
		groupIds: z.array(z.string()),
		volunteerSpots: z.number().int().nullable(),
		workout: z.object({
			description: z.string(),
			activityType: workoutCoreSchema.shape.activityType.unwrap(),
			workoutType: workoutCoreSchema.shape.workoutType,
			elapsedTime: z.number().nullable(),
			distance: z.number().nullable(),
			intervalCount: z.number(),
			intensityCategory: workoutCoreSchema.shape.intensityCategory,
			fragments: z.array(createWorkoutFragmentSchema),
		}),
	})
	.superRefine((values, ctx) => {
		const addIssue = (path: (string | number)[], message: string) =>
			ctx.addIssue({ code: "custom", message, path });
		if (!values.allDay && !values.startTime) {
			addIssue(["startTime"], "Start time is required");
		}
		if (
			!values.allDay &&
			values.startTime &&
			values.endTime &&
			values.endTime <= values.startTime
		) {
			addIssue(["endTime"], "End time must be after the start time");
		}
		if (values.type === "volunteer" && (values.volunteerSpots ?? 0) < 1) {
			addIssue(["volunteerSpots"], "Volunteer shifts need at least 1 spot");
		}
		if (values.audience === "groups" && values.groupIds.length === 0) {
			addIssue(["groupIds"], "Pick at least one group");
		}
		if (values.type === "training") {
			const { workoutType, distance, elapsedTime } = values.workout;
			if (workoutType === "distance" && !distance) {
				addIssue(["workout", "distance"], "Distance is required");
			}
			if (workoutType === "time" && !elapsedTime) {
				addIssue(["workout", "elapsedTime"], "Elapsed time is required");
			}
		}
	})
	.transform((values): CreateEvent => {
		const atTime = (time: string) =>
			DateTime.fromISO(`${values.date}T${time}`, { zone: values.timezone });
		const start = values.allDay
			? DateTime.fromISO(values.date, { zone: values.timezone })
			: atTime(values.startTime);
		const end =
			!values.allDay && values.endTime ? atTime(values.endTime) : null;
		const { elapsedTime, distance, ...workout } = values.workout;
		return {
			type: values.type,
			title: values.title,
			description: values.description.trim() || null,
			startAt: start.toISO() ?? "",
			endAt: end?.toISO() ?? null,
			allDay: values.allDay,
			timezone: values.timezone,
			location: values.location.trim() || null,
			audience: values.audience,
			groupIds: values.audience === "groups" ? values.groupIds : [],
			volunteerSpots:
				values.type === "volunteer" ? (values.volunteerSpots ?? null) : null,
			workout:
				values.type === "training"
					? {
							...workout,
							elapsedTime: elapsedTime ?? undefined,
							distance: distance ?? undefined,
						}
					: null,
		};
	});
export type EventFormInput = z.input<typeof eventFormSchema>;

const optionalGridNumber = z.preprocess(
	(value) => (value === "" || value === null ? undefined : value),
	z.coerce.number().nonnegative().optional(),
);

// One row of the bulk week editor: a training event plus its workout, in the
// units a coach types (minutes, metres) rather than the stored ones.
export const trainingRowSchema = z
	.object({
		eventId: z.string().optional(),
		title: z.string().trim().min(1, "Title is required").max(200),
		dayIndex: z.coerce.number().int().min(0).max(6),
		time: z
			.string()
			.regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Use HH:MM" }),
		activityType: workoutCoreSchema.shape.activityType.unwrap(),
		description: z.string(),
		intensityCategory: workoutCoreSchema.shape.intensityCategory,
		workoutType: workoutCoreSchema.shape.workoutType,
		durationMin: optionalGridNumber,
		distanceMeters: optionalGridNumber,
		// Session composition, flattened one column per zone so the grid can edit
		// each directly.
		zoneC1: optionalGridNumber,
		zoneC2: optionalGridNumber,
		zoneC3: optionalGridNumber,
		zoneC4: optionalGridNumber,
		zoneC5: optionalGridNumber,
		zoneC6: optionalGridNumber,
		intervalCount: z.preprocess(
			(value) => (value === "" || value === null ? undefined : value),
			z.coerce.number().int().min(1).default(1),
		),
		fragments: z.array(createWorkoutFragmentSchema).optional(),
		// Event fields the grid has no column for. They ride along so an edit made
		// in the event drawer survives until the week is saved.
		eventDetails: z
			.object({
				description: z.string().nullable(),
				lengthMin: z.number().nullable(),
				allDay: z.boolean(),
				timezone: z.string(),
				location: z.string().nullable(),
				audience: z.enum(EventAudiences),
				groupIds: z.array(z.string()),
			})
			.optional(),
	})
	.superRefine((row, ctx) => {
		if (row.workoutType === "distance" && row.distanceMeters == null) {
			ctx.addIssue({
				code: "custom",
				message: "Distance is required",
				path: ["distanceMeters"],
			});
		}
		if (row.workoutType === "time" && row.durationMin == null) {
			ctx.addIssue({
				code: "custom",
				message: "Duration is required",
				path: ["durationMin"],
			});
		}
	});
export type TrainingRow = z.infer<typeof trainingRowSchema>;

export const saveTrainingWeekSchema = z
	.object({
		creates: z.array(createEventSchema).default([]),
		updates: z.array(updateEventSchema).default([]),
		deleteIds: z.array(z.string()).default([]),
	})
	.extend(notifySchema.shape);
export type SaveTrainingWeek = z.infer<typeof saveTrainingWeekSchema>;

function refineEvent(
	event: z.infer<typeof eventFieldsSchema>,
	ctx: z.RefinementCtx,
) {
	if (event.endAt && new Date(event.endAt) <= new Date(event.startAt)) {
		ctx.addIssue({
			code: "custom",
			message: "End must be after the start",
			path: ["endAt"],
		});
	}
	if (event.type === "volunteer" && (event.volunteerSpots ?? 0) < 1) {
		ctx.addIssue({
			code: "custom",
			message: "Volunteer shifts need at least 1 spot",
			path: ["volunteerSpots"],
		});
	}
	if (event.audience === "groups" && event.groupIds.length === 0) {
		ctx.addIssue({
			code: "custom",
			message: "Pick at least one group",
			path: ["groupIds"],
		});
	}
	if (event.type === "training" && !event.workout) {
		ctx.addIssue({
			code: "custom",
			message: "Training needs a workout",
			path: ["workout"],
		});
	}
}
