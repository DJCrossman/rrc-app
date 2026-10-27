import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { CLUB_TIMEZONE } from "@/lib/schedule/week";
import type { ScheduleEvent } from "@/lib/trpc/types";
import type { CreateEvent, TrainingRow } from "@/schemas";
import {
	applyEventToRow,
	autoTitle,
	computeSaveImpact,
	computeTrainingDiff,
	createEmptyTrainingRow,
	followAutoTitle,
	rowToEvent,
	rowToFormValues,
	selectTrainingEvents,
	toTrainingRow,
} from "./trainingRows";

const weekStart = DateTime.fromISO("2026-10-18", { zone: CLUB_TIMEZONE });

const event = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent =>
	({
		id: "evt_1",
		type: "training",
		typeLabel: "Training",
		title: "Long row",
		description: null,
		startAt: "2026-10-19T12:30:00.000Z",
		endAt: "2026-10-19T14:00:00.000Z",
		allDay: false,
		timezone: CLUB_TIMEZONE,
		date: "2026-10-19",
		timeLabel: "6:30 – 8:00 AM",
		location: null,
		audience: "club",
		groupIds: [],
		groupLabel: "Club-wide",
		volunteerSpots: null,
		myRsvp: null,
		counts: { going: 0, maybe: 0, no: 0, noReply: 0 },
		volunteer: null,
		canRsvp: true,
		inAudience: true,
		workout: {
			id: "work_1",
			description: "C6 in zone",
			startDate: "2026-10-19T12:30:00.000Z",
			workoutType: "time",
			activityType: "water",
			elapsedTime: 5_400_000,
			distance: 18_000,
			intervalCount: 1,
			intensityCategory: "C6",
			zoneMinutes: { C6: 60, C5: 30 },
			eventId: "evt_1",
			eventTitle: "Long row",
			fragments: [],
		},
		...overrides,
	}) as ScheduleEvent;

const row = (overrides: Partial<TrainingRow> = {}): TrainingRow => ({
	title: "Long row",
	dayIndex: 1,
	time: "06:30",
	activityType: "water",
	description: "C6 in zone",
	intensityCategory: "C6",
	workoutType: "time",
	durationMin: 90,
	distanceMeters: 18_000,
	intervalCount: 1,
	...overrides,
});

describe("toTrainingRow", () => {
	it("places the session by its club-local date and time", () => {
		const result = toTrainingRow(event(), weekStart);
		expect(result.eventId).toBe("evt_1");
		expect(result.title).toBe("Long row");
		expect(result.dayIndex).toBe(1);
		expect(result.time).toBe("06:30");
	});

	it("maps Sunday to index 0 and Saturday to index 6", () => {
		expect(
			toTrainingRow(event({ date: "2026-10-18" }), weekStart).dayIndex,
		).toBe(0);
		expect(
			toTrainingRow(event({ date: "2026-10-24" }), weekStart).dayIndex,
		).toBe(6);
	});

	it("converts stored units to grid units and spreads the composition", () => {
		const result = toTrainingRow(event(), weekStart);
		expect(result.durationMin).toBe(90);
		expect(result.distanceMeters).toBe(18_000);
		expect(result.zoneC6).toBe(60);
		expect(result.zoneC5).toBe(30);
		expect(result.zoneC1).toBeUndefined();
	});

	it("keeps the workout as a plain description", () => {
		const result = toTrainingRow(
			event({
				title: "Morning row",
				workout: {
					...event().workout,
					description: "Steady state;3x20'",
				} as ScheduleEvent["workout"],
			}),
			weekStart,
		);
		expect(result.title).toBe("Morning row");
		expect(result.description).toBe("Steady state;3x20'");
	});

	it("carries the event's own length and details", () => {
		const result = toTrainingRow(
			event({ location: "Wascana", audience: "groups", groupIds: ["juniors"] }),
			weekStart,
		);
		expect(result.eventDetails).toMatchObject({
			lengthMin: 90,
			location: "Wascana",
			audience: "groups",
			groupIds: ["juniors"],
			timezone: CLUB_TIMEZONE,
		});
	});

	it("drops fragment ids, which event writes don't accept", () => {
		const result = toTrainingRow(
			event({
				workout: {
					...event().workout,
					fragments: [
						{
							id: "work_frag_1",
							workoutId: "work_1",
							rate: 24,
							elapsedTime: 120_000,
							distance: null,
							relativeTo: "2K",
							relativeSplit: 1.05,
						},
					],
				} as ScheduleEvent["workout"],
			}),
			weekStart,
		);
		expect(result.fragments?.[0]).toEqual({
			rate: 24,
			elapsedTime: 120_000,
			distance: undefined,
			relativeTo: "2K",
			relativeSplit: 1.05,
		});
	});
});

describe("rowToEvent", () => {
	it("builds a club-wide training event in the club timezone for a new row", () => {
		const result = rowToEvent(row(), weekStart);
		expect(result.type).toBe("training");
		expect(result.timezone).toBe(CLUB_TIMEZONE);
		expect(result.audience).toBe("club");
		expect(result.startAt).toBe("2026-10-19T06:30:00.000-06:00");
	});

	it("runs a new session as long as its workout", () => {
		const result = rowToEvent(row({ durationMin: 75 }), weekStart);
		expect(result.endAt).toBe("2026-10-19T07:45:00.000-06:00");
	});

	it("keeps an existing event's length when the session moves", () => {
		const moved = { ...toTrainingRow(event(), weekStart), time: "09:00" };
		const result = rowToEvent(moved, weekStart);
		expect(result.startAt).toBe("2026-10-19T09:00:00.000-06:00");
		expect(result.endAt).toBe("2026-10-19T10:30:00.000-06:00");
	});

	it("converts grid units back to stored units and folds the composition", () => {
		const result = rowToEvent(
			row({
				durationMin: 12.5,
				distanceMeters: 6_750.4,
				zoneC6: 10,
				zoneC4: 2.5,
			}),
			weekStart,
		);
		expect(result.workout?.elapsedTime).toBe(750_000);
		expect(result.workout?.distance).toBe(6_750);
		expect(result.workout?.zoneMinutes).toEqual({ C6: 10, C4: 2.5 });
	});

	it("places sessions by wall-clock time across a DST change", () => {
		const toronto = {
			...row({ dayIndex: 0, time: "06:30" }),
			eventDetails: {
				description: null,
				lengthMin: 60,
				allDay: false,
				timezone: "America/Toronto",
				location: null,
				audience: "club" as const,
				groupIds: [],
			},
		};
		const dstWeek = DateTime.fromISO("2026-11-01", { zone: CLUB_TIMEZONE });
		expect(rowToEvent(toronto, dstWeek).startAt).toBe(
			"2026-11-01T06:30:00.000-05:00",
		);
	});
});

describe("computeTrainingDiff", () => {
	it("treats rows without an event as creates", () => {
		const diff = computeTrainingDiff([], [row()], weekStart);
		expect(diff.creates).toHaveLength(1);
		expect(diff.updates).toHaveLength(0);
		expect(diff.deleteIds).toHaveLength(0);
	});

	it("produces no changes when rows match the week", () => {
		const baseline = [event()];
		const rows = baseline.map((e) => toTrainingRow(e, weekStart));
		const diff = computeTrainingDiff(baseline, rows, weekStart);
		expect(diff).toEqual({ creates: [], updates: [], deleteIds: [] });
	});

	it("does not treat stored seconds as an edit", () => {
		const baseline = [event({ startAt: "2026-10-19T12:30:45.000Z" })];
		const rows = baseline.map((e) => toTrainingRow(e, weekStart));
		expect(computeTrainingDiff(baseline, rows, weekStart).updates).toHaveLength(
			0,
		);
	});

	it("detects a renamed session as an update", () => {
		const baseline = [event()];
		const rows = [{ ...toTrainingRow(event(), weekStart), title: "Pieces" }];
		const diff = computeTrainingDiff(baseline, rows, weekStart);
		expect(diff.updates).toHaveLength(1);
		expect(diff.updates[0]).toMatchObject({ id: "evt_1", title: "Pieces" });
	});

	it("detects a moved session as an update", () => {
		const baseline = [event()];
		const rows = [{ ...toTrainingRow(event(), weekStart), dayIndex: 3 }];
		const diff = computeTrainingDiff(baseline, rows, weekStart);
		expect(diff.updates[0].startAt).toBe("2026-10-21T06:30:00.000-06:00");
	});

	it("detects a composition change as an update", () => {
		const baseline = [event()];
		const rows = [{ ...toTrainingRow(event(), weekStart), zoneC5: 20 }];
		expect(computeTrainingDiff(baseline, rows, weekStart).updates).toHaveLength(
			1,
		);
	});

	it("detects a fragment change made in the drawer as an update", () => {
		const baseline = [event()];
		const rows = [
			{
				...toTrainingRow(event(), weekStart),
				fragments: [
					{ rate: 22, relativeTo: "2K" as const, relativeSplit: 1.1 },
				],
			},
		];
		expect(computeTrainingDiff(baseline, rows, weekStart).updates).toHaveLength(
			1,
		);
	});

	it("marks sessions missing from the grid as deletes", () => {
		const baseline = [event(), event({ id: "evt_2" })];
		const rows = [toTrainingRow(baseline[0], weekStart)];
		const diff = computeTrainingDiff(baseline, rows, weekStart);
		expect(diff.deleteIds).toEqual(["evt_2"]);
		expect(diff.updates).toHaveLength(0);
	});

	it("re-creates a row whose event was deleted elsewhere", () => {
		const diff = computeTrainingDiff(
			[],
			[{ ...row(), eventId: "evt_gone" }],
			weekStart,
		);
		expect(diff.creates).toHaveLength(1);
		expect(diff.creates[0]).not.toHaveProperty("id");
		expect(diff.updates).toHaveLength(0);
	});

	it("preserves an event's audience and location through an update", () => {
		const original = event({
			audience: "groups",
			groupIds: ["juniors"],
			location: "Wascana",
		});
		const rows = [{ ...toTrainingRow(original, weekStart), title: "Pieces" }];
		const [update] = computeTrainingDiff([original], rows, weekStart).updates;
		expect(update).toMatchObject({
			audience: "groups",
			groupIds: ["juniors"],
			location: "Wascana",
		});
	});
});

describe("applyEventToRow", () => {
	const submitted = (overrides: Partial<CreateEvent> = {}): CreateEvent => ({
		...rowToEvent(row(), weekStart),
		title: "Renamed",
		startAt: "2026-10-20T07:00:00.000-06:00",
		endAt: "2026-10-20T08:00:00.000-06:00",
		location: "Boathouse",
		...overrides,
	});

	it("moves the row to the submitted day and time", () => {
		const result = applyEventToRow(row(), submitted(), weekStart);
		expect(result.title).toBe("Renamed");
		expect(result.dayIndex).toBe(2);
		expect(result.time).toBe("07:00");
		expect(result.eventDetails).toMatchObject({
			lengthMin: 60,
			location: "Boathouse",
		});
	});

	it("keeps the row's composition, which the drawer doesn't edit", () => {
		const result = applyEventToRow(
			row({ zoneC6: 60, zoneC5: 30 }),
			submitted(),
			weekStart,
		);
		expect(result.zoneC6).toBe(60);
		expect(result.zoneC5).toBe(30);
	});
});

describe("rowToFormValues", () => {
	it("prefills the event form from a half-filled row", () => {
		const values = rowToFormValues(
			{ title: "Tempo", dayIndex: 2, time: "17:00", durationMin: 45 },
			weekStart,
		);
		expect(values).toMatchObject({
			type: "training",
			title: "Tempo",
			date: "2026-10-20",
			startTime: "17:00",
			endTime: "17:45",
		});
		expect(values.workout.elapsedTime).toBe(2_700_000);
	});
});

describe("selectTrainingEvents", () => {
	it("keeps only training events that carry a workout", () => {
		const days = [
			{
				date: "2026-10-19",
				isToday: false,
				events: [
					event(),
					event({ id: "evt_regatta", type: "regatta", workout: null }),
					event({ id: "evt_bare", workout: null }),
				],
			},
		];
		expect(selectTrainingEvents(days).map((e) => e.id)).toEqual(["evt_1"]);
	});
});

describe("autoTitle", () => {
	it("names the time of day and the mode", () => {
		expect(autoTitle({ time: "06:00", activityType: "water" })).toBe(
			"Morning row",
		);
		expect(autoTitle({ time: "17:30", activityType: "erg" })).toBe(
			"Evening erg",
		);
		expect(autoTitle({ time: "07:00", activityType: "strength" })).toBe(
			"Morning S&C",
		);
		expect(autoTitle({ time: "16:00", activityType: "crossTrain" })).toBe(
			"Evening XT",
		);
	});

	it("treats noon onwards as evening, as main's migration did", () => {
		expect(autoTitle({ time: "11:59", activityType: "water" })).toBe(
			"Morning row",
		);
		expect(autoTitle({ time: "12:00", activityType: "water" })).toBe(
			"Evening row",
		);
	});
});

describe("followAutoTitle", () => {
	const generated: Partial<TrainingRow> = {
		title: "Morning row",
		time: "06:00",
		activityType: "water",
	};

	it("updates a generated title when the time changes", () => {
		expect(
			followAutoTitle(generated, { ...generated, time: "17:00" }).title,
		).toBe("Evening row");
	});

	it("updates a generated title when the mode changes", () => {
		expect(
			followAutoTitle(generated, { ...generated, activityType: "strength" })
				.title,
		).toBe("Morning S&C");
	});

	it("leaves a title the coach wrote alone", () => {
		const custom = { ...generated, title: "Pieces" };
		expect(followAutoTitle(custom, { ...custom, time: "17:00" }).title).toBe(
			"Pieces",
		);
	});

	it("keeps a title the coach is typing right now", () => {
		expect(
			followAutoTitle(generated, { ...generated, title: "Tempo" }).title,
		).toBe("Tempo");
	});
});

describe("createEmptyTrainingRow", () => {
	it("starts on the water in summer and on the erg otherwise", () => {
		const summer = DateTime.fromISO("2026-07-05", { zone: CLUB_TIMEZONE });
		expect(createEmptyTrainingRow(0, summer).activityType).toBe("water");
		expect(createEmptyTrainingRow(0, weekStart).activityType).toBe("erg");
	});

	it("starts with a generated title to match", () => {
		expect(createEmptyTrainingRow(0, weekStart).title).toBe("Morning erg");
	});
});

describe("computeSaveImpact", () => {
	const now = DateTime.fromISO("2026-10-18T00:00:00.000-06:00");
	const responded = (overrides: Partial<ScheduleEvent> = {}) =>
		event({ counts: { going: 3, maybe: 1, no: 1, noReply: 0 }, ...overrides });

	it("counts going RSVPs on deleted sessions and who a change would reach", () => {
		const baseline = [responded()];
		const impact = computeSaveImpact(
			baseline,
			{ creates: [], updates: [], deleteIds: ["evt_1"] },
			now,
		);
		expect(impact).toEqual({
			goingOnDeleted: 3,
			changedSessions: 1,
			notifiableRsvps: 4,
		});
	});

	it("counts a moved session but not a workout-only edit", () => {
		const moved = responded();
		const tweaked = responded({ id: "evt_2" });
		const diff = computeTrainingDiff(
			[moved, tweaked],
			[
				{ ...toTrainingRow(moved, weekStart), time: "17:00" },
				{ ...toTrainingRow(tweaked, weekStart), description: "4x2k" },
			],
			weekStart,
		);
		expect(computeSaveImpact([moved, tweaked], diff, now)).toEqual({
			goingOnDeleted: 0,
			changedSessions: 1,
			notifiableRsvps: 4,
		});
	});

	it("ignores sessions that already happened", () => {
		const later = DateTime.fromISO("2026-10-25T00:00:00.000-06:00");
		expect(
			computeSaveImpact(
				[responded()],
				{ creates: [], updates: [], deleteIds: ["evt_1"] },
				later,
			),
		).toEqual({ goingOnDeleted: 3, changedSessions: 0, notifiableRsvps: 0 });
	});
});
