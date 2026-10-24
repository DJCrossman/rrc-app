import { describe, expect, it } from "vitest";
import type { ScheduleEvent } from "@/lib/trpc/types";
import { eventFormSchema } from "@/schemas";
import { getEventFormValues } from "./getEventFormValues";

const event = {
	id: "evt_1",
	type: "training",
	title: "Morning erg",
	description: "Coached.",
	startAt: "2026-11-02T12:00:00.000Z",
	endAt: "2026-11-02T13:30:00.000Z",
	allDay: false,
	timezone: "America/Regina",
	date: "2026-11-02",
	location: "Shewy's",
	audience: "groups",
	groupIds: ["grp_masters"],
	volunteerSpots: null,
	workout: {
		id: "work_1",
		description: "3x20' r20",
		startDate: "2026-11-02T12:00:00.000Z",
		workoutType: "time",
		activityType: "erg",
		elapsedTime: 3_600_000,
		distance: null,
		intervalCount: 3,
		intensityCategory: "C5",
		eventId: "evt_1",
		fragments: [
			{
				id: "frag_1",
				workoutId: "work_1",
				rate: 20,
				elapsedTime: 1_200_000,
				distance: null,
				relativeTo: "6K",
				relativeSplit: 6000,
			},
		],
	},
} as unknown as ScheduleEvent;

describe("getEventFormValues", () => {
	it("resubmits an untouched event unchanged", () => {
		const input = eventFormSchema.parse(getEventFormValues(event));
		expect(new Date(input.startAt).toISOString()).toBe(event.startAt);
		expect(new Date(input.endAt ?? "").toISOString()).toBe(event.endAt);
		expect(input).toMatchObject({
			type: "training",
			title: "Morning erg",
			description: "Coached.",
			location: "Shewy's",
			audience: "groups",
			groupIds: ["grp_masters"],
			workout: {
				description: "3x20' r20",
				activityType: "erg",
				workoutType: "time",
				elapsedTime: 3_600_000,
				distance: undefined,
				intervalCount: 3,
				intensityCategory: "C5",
				fragments: [
					{
						rate: 20,
						elapsedTime: 1_200_000,
						distance: undefined,
						relativeTo: "6K",
						relativeSplit: 6000,
					},
				],
			},
		});
	});

	it("starts a workout for an event that does not have one", () => {
		const values = getEventFormValues({
			...event,
			type: "regatta",
			workout: null,
		});
		expect(values.workout).toMatchObject({
			description: "",
			workoutType: "time",
			intensityCategory: "C6",
		});
	});
});
