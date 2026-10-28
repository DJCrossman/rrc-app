import { describe, expect, it } from "vitest";
import { type EventFormInput, eventFormSchema } from "./schedule.schema";

const values: EventFormInput = {
	type: "training",
	title: "Morning row",
	description: "",
	date: "2026-11-02",
	allDay: false,
	startTime: "06:00",
	endTime: "07:30",
	timezone: "America/Regina",
	location: " Boathouse ",
	audience: "club",
	groupIds: ["grp_a"],
	volunteerSpots: 3,
	hasWorkout: true,
	workout: {
		description: "3x20' r3",
		activityType: "erg",
		workoutType: "time",
		elapsedTime: 3_600_000,
		distance: null,
		intervalCount: 3,
		intensityCategory: "C5",
		fragments: [],
	},
};

describe("eventFormSchema", () => {
	it("turns a training into an event with its workout in club time", () => {
		const event = eventFormSchema.parse(values);
		expect(event).toMatchObject({
			type: "training",
			startAt: "2026-11-02T06:00:00.000-06:00",
			endAt: "2026-11-02T07:30:00.000-06:00",
			location: "Boathouse",
			groupIds: [],
			volunteerSpots: null,
			workout: {
				description: "3x20' r3",
				elapsedTime: 3_600_000,
				distance: undefined,
				intensityCategory: "C5",
			},
		});
	});

	it("drops the workout for other event types", () => {
		const event = eventFormSchema.parse({
			...values,
			type: "volunteer",
			allDay: true,
		});
		expect(event.workout).toBeNull();
		expect(event.volunteerSpots).toBe(3);
		expect(event.startAt).toBe("2026-11-02T00:00:00.000-06:00");
		expect(event.endAt).toBeNull();
	});

	it("requires the measure that matches the workout type", () => {
		const result = eventFormSchema.safeParse({
			...values,
			workout: { ...values.workout, workoutType: "distance" },
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
			"workout.distance",
		]);
	});

	it("ignores workout rules for events that are not training", () => {
		const result = eventFormSchema.safeParse({
			...values,
			type: "regatta",
			workout: { ...values.workout, elapsedTime: null },
		});
		expect(result.success).toBe(true);
	});

	it("saves a training without a workout when it was skipped", () => {
		const result = eventFormSchema.safeParse({
			...values,
			hasWorkout: false,
			workout: { ...values.workout, elapsedTime: null },
		});
		expect(result.success).toBe(true);
		expect(result.data?.workout).toBeNull();
	});

	it("rejects an end time before the start", () => {
		const result = eventFormSchema.safeParse({ ...values, endTime: "05:00" });
		expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
			"endTime",
		]);
	});
});
