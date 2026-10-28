import { DateTime } from "luxon";
import {
	detectScheduleChange,
	type SessionSnapshot,
} from "@/lib/schedule/changes";
import {
	EVENT_TYPE_LABELS,
	formatEventTime,
	formatGroupLabel,
} from "@/lib/schedule/event-labels";
import { CLUB_TIMEZONE } from "@/lib/schedule/week";
import type { ScheduleEvent, ScheduleWeek } from "@/lib/trpc/types";
import {
	type CreateEvent,
	type EventFormInput,
	IntensityCategories,
	type SaveTrainingWeek,
	type TrainingRow,
	type UpdateEvent,
	type WorkoutActivityType,
	type ZoneMinutes,
} from "@/schemas";
import { getNewEventFormValues } from "../../ScheduleScene/utils/getEventFormValues";

type EventDetails = NonNullable<TrainingRow["eventDetails"]>;

// The changes a save would make. Whether to notify athletes is the coach's call
// at save time, so it isn't part of the diff.
export type TrainingWeekDiff = Omit<SaveTrainingWeek, "notify">;

// `__id` is the grid's own row key: it survives editing (unlike `id`, which only
// exists once a row has been saved) so unsaved rows stay addressable.
export type BulkRow = Partial<TrainingRow> & { __id: string };

export function computeTrainingDiff(
	baseline: ScheduleEvent[],
	rows: TrainingRow[],
	weekStart: DateTime,
): TrainingWeekDiff {
	const baselineById = new Map(baseline.map((event) => [event.id, event]));
	const creates: CreateEvent[] = [];
	const updates: UpdateEvent[] = [];
	const seenIds = new Set<string>();

	for (const row of rows) {
		const original = row.eventId ? baselineById.get(row.eventId) : undefined;
		// A row whose event disappeared (deleted in another tab) is re-created
		// rather than updated, so one stale id can't roll back the whole week.
		if (!original) {
			creates.push(rowToEvent(row, weekStart));
			continue;
		}
		seenIds.add(original.id);
		const event = rowToEvent(row, weekStart);
		if (hasChanged(original, event)) {
			updates.push({ ...event, id: original.id });
		}
	}

	const deleteIds = baseline
		.map((event) => event.id)
		.filter((id) => !seenIds.has(id));

	return { creates, updates, deleteIds };
}

export type SaveImpact = {
	/** "Going" RSVPs on sessions the save deletes. */
	goingOnDeleted: number;
	/** Upcoming sessions the save moves, relocates or cancels. */
	changedSessions: number;
	/** Going and maybe RSVPs across those sessions. */
	notifiableRsvps: number;
};

// What a save would do to athletes who've responded, using the same change rules
// the server applies when it decides who to notify.
export function computeSaveImpact(
	baseline: ScheduleEvent[],
	diff: TrainingWeekDiff,
	now: DateTime = DateTime.now(),
): SaveImpact {
	const updatesById = new Map(
		diff.updates.map((update) => [update.id, update]),
	);
	const deletedIds = new Set(diff.deleteIds);
	const impact: SaveImpact = {
		goingOnDeleted: 0,
		changedSessions: 0,
		notifiableRsvps: 0,
	};
	for (const event of baseline) {
		const update = updatesById.get(event.id);
		const deleted = deletedIds.has(event.id);
		if (!update && !deleted) continue;
		if (deleted) impact.goingOnDeleted += event.counts.going;
		const change = detectScheduleChange(
			toSnapshot(event.id, event),
			update ? toSnapshot(event.id, update) : null,
			now,
		);
		if (change) {
			impact.changedSessions += 1;
			impact.notifiableRsvps += event.counts.going + event.counts.maybe;
		}
	}
	return impact;
}

export function selectTrainingEvents(days: ScheduleWeek["days"]) {
	return days.flatMap(({ events }) =>
		events.filter((event) => event.type === "training" && event.workout),
	);
}

export function toBulkRow(event: ScheduleEvent, weekStart: DateTime): BulkRow {
	return { ...toTrainingRow(event, weekStart), __id: crypto.randomUUID() };
}

export function stripInternal({ __id, ...row }: BulkRow) {
	return row;
}

export function toTrainingRow(
	event: ScheduleEvent,
	weekStart: DateTime,
): TrainingRow {
	const workout = event.workout;
	const start = DateTime.fromISO(event.startAt, { zone: event.timezone });
	return {
		eventId: event.id,
		title: event.title,
		dayIndex: dayIndexOf(event.date, weekStart),
		time: start.toFormat("HH:mm"),
		activityType: workout?.activityType ?? "erg",
		description: workout?.description ?? "",
		intensityCategory: workout?.intensityCategory ?? "C6",
		workoutType: workout?.workoutType ?? "time",
		durationMin:
			workout?.elapsedTime != null ? workout.elapsedTime / 60_000 : undefined,
		distanceMeters: workout?.distance ?? undefined,
		intervalCount: workout?.intervalCount ?? 1,
		...zoneMinutesToRow(workout?.zoneMinutes),
		fragments: workout?.fragments.map((fragment) => ({
			rate: fragment.rate ?? undefined,
			elapsedTime: fragment.elapsedTime ?? undefined,
			distance: fragment.distance ?? undefined,
			relativeTo: fragment.relativeTo as "2K" | "6K",
			relativeSplit: fragment.relativeSplit,
		})),
		eventDetails: {
			description: event.description,
			// Measured from the minute the grid shows, so stray seconds on the stored
			// start don't shift the end time when the row is written back.
			lengthMin: event.endAt
				? DateTime.fromISO(event.endAt).diff(start.startOf("minute"), "minutes")
						.minutes
				: null,
			allDay: event.allDay,
			timezone: event.timezone,
			location: event.location,
			audience: event.audience,
			groupIds: event.groupIds,
		},
	};
}

export function rowToEvent(row: TrainingRow, weekStart: DateTime): CreateEvent {
	const details = row.eventDetails ?? newEventDetails(row);
	const date = weekStart.plus({ days: row.dayIndex }).toISODate() as string;
	const start = details.allDay
		? DateTime.fromISO(date, { zone: details.timezone })
		: DateTime.fromISO(`${date}T${row.time}`, { zone: details.timezone });
	const end =
		!details.allDay && details.lengthMin
			? start.plus({ minutes: details.lengthMin })
			: null;
	return {
		type: "training",
		title: row.title,
		description: details.description,
		startAt: start.toISO() as string,
		endAt: end?.toISO() ?? null,
		allDay: details.allDay,
		timezone: details.timezone,
		location: details.location,
		audience: details.audience,
		groupIds: details.audience === "groups" ? details.groupIds : [],
		volunteerSpots: null,
		workout: {
			description: row.description,
			workoutType: row.workoutType,
			activityType: row.activityType,
			elapsedTime:
				row.durationMin != null
					? Math.round(row.durationMin * 60_000)
					: undefined,
			distance:
				row.distanceMeters != null ? Math.round(row.distanceMeters) : undefined,
			intervalCount: row.intervalCount,
			intensityCategory: row.intensityCategory,
			fragments: row.fragments ?? [],
			zoneMinutes: zoneMinutesFromRow(row),
		},
	};
}

// Folds an event-drawer submission back into its grid row. The drawer's form has
// no composition fields, so the row keeps the zone minutes it already had.
export function applyEventToRow<T extends Partial<TrainingRow>>(
	row: T,
	event: CreateEvent,
	weekStart: DateTime,
): T {
	const start = DateTime.fromISO(event.startAt, { zone: event.timezone });
	const workout = event.workout;
	return {
		...row,
		title: event.title,
		dayIndex: dayIndexOf(start.toISODate() as string, weekStart),
		time: start.toFormat("HH:mm"),
		...(workout && {
			activityType: workout.activityType,
			description: workout.description,
			intensityCategory: workout.intensityCategory,
			workoutType: workout.workoutType,
			durationMin:
				workout.elapsedTime != null ? workout.elapsedTime / 60_000 : undefined,
			distanceMeters: workout.distance,
			intervalCount: workout.intervalCount,
			fragments: workout.fragments,
		}),
		eventDetails: {
			description: event.description ?? null,
			lengthMin: event.endAt
				? DateTime.fromISO(event.endAt).diff(start, "minutes").minutes
				: null,
			allDay: event.allDay,
			timezone: event.timezone,
			location: event.location ?? null,
			audience: event.audience,
			groupIds: event.groupIds,
		},
	};
}

// Shapes a persisted row as the event the details drawer renders, so it opens on
// what the coach currently sees rather than the last saved values.
export function rowToScheduleEvent(
	row: TrainingRow,
	original: ScheduleEvent,
	weekStart: DateTime,
): ScheduleEvent {
	const event = rowToEvent(row, weekStart);
	const workout = event.workout;
	return {
		...original,
		title: event.title,
		description: event.description ?? null,
		startAt: event.startAt,
		endAt: event.endAt ?? null,
		allDay: event.allDay,
		timezone: event.timezone,
		date: weekStart.plus({ days: row.dayIndex }).toISODate() as string,
		timeLabel: formatEventTime({ ...event, endAt: event.endAt ?? null }),
		typeLabel: EVENT_TYPE_LABELS.training,
		location: event.location ?? null,
		audience: event.audience,
		groupIds: event.groupIds,
		groupLabel:
			original.audience === event.audience &&
			original.groupIds.join() === event.groupIds.join()
				? original.groupLabel
				: formatGroupLabel(event.audience, event.groupIds),
		workout:
			original.workout && workout
				? {
						...original.workout,
						description: workout.description,
						workoutType: workout.workoutType,
						activityType: workout.activityType,
						elapsedTime: workout.elapsedTime ?? null,
						distance: workout.distance ?? null,
						intervalCount: workout.intervalCount,
						intensityCategory: workout.intensityCategory,
						fragments: (workout.fragments ?? []).map((fragment, index) => ({
							id: original.workout?.fragments[index]?.id ?? `pending-${index}`,
							workoutId: original.workout?.id ?? "",
							rate: fragment.rate ?? null,
							elapsedTime: fragment.elapsedTime ?? null,
							distance: fragment.distance ?? null,
							relativeTo: fragment.relativeTo,
							relativeSplit: fragment.relativeSplit,
						})),
					}
				: original.workout,
	};
}

// Prefills the create drawer from a row that may still be half-filled in.
export function rowToFormValues(
	row: Partial<TrainingRow>,
	weekStart: DateTime,
): EventFormInput {
	const date = weekStart
		.plus({ days: row.dayIndex ?? 0 })
		.toISODate() as string;
	const defaults = getNewEventFormValues(date);
	const details = row.eventDetails;
	const lengthMin = details?.lengthMin ?? row.durationMin;
	const startTime = row.time ?? defaults.startTime;
	return {
		...defaults,
		title: row.title ?? "",
		description: details?.description ?? "",
		allDay: details?.allDay ?? false,
		startTime,
		endTime: lengthMin
			? DateTime.fromISO(`${date}T${startTime}`)
					.plus({ minutes: lengthMin })
					.toFormat("HH:mm")
			: defaults.endTime,
		timezone: details?.timezone ?? defaults.timezone,
		location: details?.location ?? "",
		audience: details?.audience ?? defaults.audience,
		groupIds: details?.groupIds ?? [],
		workout: {
			description: row.description ?? "",
			activityType: row.activityType ?? defaults.workout.activityType,
			workoutType: row.workoutType ?? defaults.workout.workoutType,
			elapsedTime:
				row.durationMin != null ? Math.round(row.durationMin * 60_000) : null,
			distance:
				row.distanceMeters != null ? Math.round(row.distanceMeters) : null,
			intervalCount: row.intervalCount ?? 1,
			intensityCategory:
				row.intensityCategory ?? defaults.workout.intensityCategory,
			fragments: row.fragments ?? [],
		},
	};
}

// New rows start on the water May–September and on the erg otherwise, the same
// default main's New event form uses.
export function createEmptyTrainingRow(
	dayIndex: number,
	weekStart: DateTime,
): Partial<TrainingRow> {
	const date = weekStart.plus({ days: dayIndex }).toISODate() as string;
	const row: Partial<TrainingRow> = {
		dayIndex,
		time: "06:00",
		activityType: getNewEventFormValues(date).workout.activityType,
		description: "",
		intensityCategory: "C6",
		workoutType: "time",
		intervalCount: 1,
	};
	return { ...row, title: autoTitle(row) };
}

export function autoTitle({
	time,
	activityType,
}: Pick<Partial<TrainingRow>, "time" | "activityType">) {
	const hour = Number((time ?? "06:00").split(":")[0]);
	return `${hour < 12 ? "Morning" : "Evening"} ${MODE_TITLE_WORDS[activityType ?? "water"]}`;
}

// Keeps a row's title in step with its time and mode for as long as it's still
// the generated one; the moment the coach writes their own, it's left alone.
export function followAutoTitle<T extends Partial<TrainingRow>>(
	previous: T,
	next: T,
): T {
	const wasGenerated = previous.title === autoTitle(previous);
	const titleEditedNow = next.title !== previous.title;
	if (!wasGenerated || titleEditedNow) return next;
	return { ...next, title: autoTitle(next) };
}

export function zoneMinutesTotal(row: Partial<TrainingRow>) {
	return IntensityCategories.reduce(
		(total, zone) => total + (row[`zone${zone}` as const] ?? 0),
		0,
	);
}

function zoneMinutesFromRow(row: Partial<TrainingRow>): ZoneMinutes {
	const zoneMinutes: ZoneMinutes = {};
	for (const zone of IntensityCategories) {
		const minutes = row[`zone${zone}` as const];
		if (minutes != null) zoneMinutes[zone] = minutes;
	}
	return zoneMinutes;
}

function zoneMinutesToRow(zoneMinutes: ZoneMinutes | undefined) {
	return Object.fromEntries(
		IntensityCategories.map((zone) => [`zone${zone}`, zoneMinutes?.[zone]]),
	) as Pick<
		TrainingRow,
		"zoneC1" | "zoneC2" | "zoneC3" | "zoneC4" | "zoneC5" | "zoneC6"
	>;
}

// Dates are compared as plain calendar days so a DST change inside the week
// can't nudge a session onto the neighbouring day.
function dayIndexOf(isoDate: string, weekStart: DateTime) {
	return Math.round(
		DateTime.fromISO(isoDate, { zone: "utc" }).diff(
			DateTime.fromISO(weekStart.toISODate() as string, { zone: "utc" }),
			"days",
		).days,
	);
}

// New sessions run as long as their workout, the same rule main's migration used
// when it turned the old training plan into events.
function newEventDetails(row: TrainingRow): EventDetails {
	return {
		description: null,
		lengthMin: row.durationMin ?? null,
		allDay: false,
		timezone: CLUB_TIMEZONE,
		location: null,
		audience: "club",
		groupIds: [],
	};
}

function hasChanged(original: ScheduleEvent, event: CreateEvent) {
	const workout = original.workout;
	const next = event.workout;
	return (
		original.title !== event.title ||
		(original.description ?? null) !== (event.description ?? null) ||
		// The grid only carries HH:mm, so seconds must not read as a change.
		!sameMinute(original.startAt, event.startAt) ||
		!sameMinute(original.endAt, event.endAt ?? null) ||
		original.allDay !== event.allDay ||
		original.timezone !== event.timezone ||
		(original.location ?? null) !== (event.location ?? null) ||
		original.audience !== event.audience ||
		original.groupIds.join() !== event.groupIds.join() ||
		workout?.description !== next?.description ||
		workout?.workoutType !== next?.workoutType ||
		workout?.activityType !== next?.activityType ||
		(workout?.elapsedTime ?? undefined) !== next?.elapsedTime ||
		(workout?.distance ?? undefined) !== next?.distance ||
		workout?.intervalCount !== next?.intervalCount ||
		workout?.intensityCategory !== next?.intensityCategory ||
		hasFragmentsChanged(workout?.fragments ?? [], next?.fragments ?? []) ||
		IntensityCategories.some(
			(zone) =>
				(workout?.zoneMinutes?.[zone] ?? 0) !==
				(next?.zoneMinutes?.[zone] ?? 0),
		)
	);
}

function sameMinute(a: string | null, b: string | null) {
	if (!a || !b) return a === b;
	return DateTime.fromISO(a)
		.startOf("minute")
		.equals(DateTime.fromISO(b).startOf("minute"));
}

function hasFragmentsChanged(
	original: NonNullable<ScheduleEvent["workout"]>["fragments"],
	next: NonNullable<CreateEvent["workout"]>["fragments"] = [],
) {
	const normalize = (fragment: {
		rate?: number | null;
		elapsedTime?: number | null;
		distance?: number | null;
		relativeTo: string;
		relativeSplit: number;
	}) =>
		[
			fragment.rate ?? null,
			fragment.elapsedTime ?? null,
			fragment.distance ?? null,
			fragment.relativeTo,
			fragment.relativeSplit,
		].join("|");
	return (
		original.length !== next.length ||
		original.some((fragment, i) => normalize(fragment) !== normalize(next[i]))
	);
}

const MODE_TITLE_WORDS = {
	water: "row",
	erg: "erg",
	crossTrain: "XT",
	strength: "S&C",
} satisfies Record<WorkoutActivityType, string>;

function toSnapshot(
	id: string,
	event: Pick<CreateEvent, "type" | "startAt" | "location" | "timezone">,
): SessionSnapshot {
	return {
		id,
		type: event.type,
		startAt: event.startAt,
		location: event.location ?? null,
		timezone: event.timezone,
	};
}
