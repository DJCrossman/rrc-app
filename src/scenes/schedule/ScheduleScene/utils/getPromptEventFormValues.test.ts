import { describe, expect, it } from "vitest";
import { eventFormSchema } from "@/schemas";
import { getPromptEventFormValues } from "./getPromptEventFormValues";

const training = {
	type: "training",
	title: "Morning erg",
	date: "2026-11-02",
	allDay: false,
	startTime: "06:00",
	endTime: "07:00",
	workout: {
		description: "60' steady state",
		activityType: "erg",
		intensityCategory: "C6",
	},
} as const;

describe("getPromptEventFormValues", () => {
	it("fills the workout from its parsed description", () => {
		const values = getPromptEventFormValues(training, {
			workoutType: "time",
			elapsedTime: 3_600_000,
			intervalCount: 1,
		});
		const event = eventFormSchema.parse(values);
		expect(event.title).toBe("Morning erg");
		expect(event.workout).toMatchObject({
			description: "60' steady state",
			activityType: "erg",
			workoutType: "time",
			elapsedTime: 3_600_000,
		});
	});

	it("falls back to an other workout when the length is missing", () => {
		const unparsed = getPromptEventFormValues(training);
		expect(eventFormSchema.parse(unparsed).workout?.workoutType).toBe("other");
		const unmeasured = getPromptEventFormValues(training, {
			workoutType: "distance",
			intervalCount: 4,
		});
		expect(eventFormSchema.parse(unmeasured).workout?.workoutType).toBe(
			"other",
		);
	});

	it("drops an end time that isn't after the start time", () => {
		const values = getPromptEventFormValues({
			type: "training",
			title: "Evening row",
			date: "2026-11-02",
			allDay: false,
			startTime: "17:00",
		});
		expect(values.endTime).toBe("");
		expect(eventFormSchema.parse(values).workout).toBeNull();
	});

	it("keeps an all-day regatta and gives volunteer shifts a spot", () => {
		const regatta = getPromptEventFormValues({
			type: "regatta",
			title: "Wascana Regatta",
			date: "2026-11-07",
			allDay: true,
		});
		expect(eventFormSchema.parse(regatta)).toMatchObject({
			allDay: true,
			endAt: null,
		});
		const shift = getPromptEventFormValues({
			type: "volunteer",
			title: "Dock setup",
			date: "2026-11-08",
			allDay: false,
			startTime: "09:00",
		});
		expect(eventFormSchema.parse(shift).volunteerSpots).toBe(1);
	});
});
