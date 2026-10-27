import { describe, expect, it } from "vitest";
import { type EventRow, mapToEventDto } from "./map-to-event-dto";

const baseEvent: EventRow = {
	id: "evt_1",
	type: "training",
	title: "Morning row",
	description: null,
	startAt: new Date("2026-10-21T03:30:00Z"),
	endAt: new Date("2026-10-21T04:30:00Z"),
	allDay: false,
	timezone: "America/Regina",
	location: "Wascana boathouse",
	workoutId: "work_1",
	audience: "club",
	volunteerSpots: null,
	createdById: null,
	createdAt: new Date("2026-10-01T00:00:00Z"),
	updatedAt: new Date("2026-10-01T00:00:00Z"),
	workout: {
		id: "work_1",
		description: "Steady state;3x20'",
		startDate: new Date("2026-10-21T03:30:00Z"),
		workoutType: "time",
		activityType: "water",
		elapsedTime: 3_600_000,
		distance: null,
		intervalCount: 3,
		intensityCategory: "C5",
		fragments: [],
		zoneMinutes: [],
		event: { id: "evt_1", title: "Morning row" },
	},
	groups: [],
	rsvps: [
		{ athleteId: "ath_me", status: "maybe" },
		{ athleteId: "ath_2", status: "yes" },
	],
};

const audienceIds = new Set(["ath_me", "ath_2", "ath_3", "ath_4"]);

describe("mapToEventDto", () => {
	it("buckets by the event's local date and reports my RSVP and counts", () => {
		const dto = mapToEventDto(baseEvent, { athleteId: "ath_me", audienceIds });
		expect(dto.date).toBe("2026-10-20");
		expect(dto.timeLabel).toBe("9:30 – 10:30 PM");
		expect(dto.myRsvp).toBe("maybe");
		expect(dto.counts).toEqual({ going: 1, maybe: 1, no: 0, noReply: 2 });
		expect(dto.groupLabel).toBe("Club-wide");
		expect(dto.canRsvp).toBe(true);
		expect(dto.volunteer).toBeNull();
		expect(dto.workout).toMatchObject({
			id: "work_1",
			intensityCategory: "C5",
			eventId: "evt_1",
		});
	});

	it("does not let people outside the audience RSVP", () => {
		const dto = mapToEventDto(baseEvent, {
			athleteId: "ath_other",
			audienceIds,
		});
		expect(dto.inAudience).toBe(false);
		expect(dto.canRsvp).toBe(false);
		expect(dto.myRsvp).toBeNull();
	});

	it("shows counts but no RSVP to an admin without an athlete profile", () => {
		const dto = mapToEventDto(baseEvent, { athleteId: null, audienceIds });
		expect(dto.counts).toEqual({ going: 1, maybe: 1, no: 0, noReply: 2 });
		expect(dto.myRsvp).toBeNull();
		expect(dto.inAudience).toBe(false);
		expect(dto.canRsvp).toBe(false);
	});

	it("treats a volunteer's yes RSVPs as filled spots", () => {
		const dto = mapToEventDto(
			{
				...baseEvent,
				type: "volunteer",
				workoutId: null,
				workout: null,
				volunteerSpots: 2,
				rsvps: [
					{ athleteId: "ath_me", status: "yes" },
					{ athleteId: "ath_2", status: "yes" },
				],
			},
			{ athleteId: "ath_me", audienceIds },
		);
		expect(dto.volunteer).toEqual({ filled: 2, spots: 2, signedUp: true });
		expect(dto.counts.noReply).toBe(2);
	});

	it("is not signed up to a shift without a yes RSVP", () => {
		const dto = mapToEventDto(
			{
				...baseEvent,
				type: "volunteer",
				volunteerSpots: 2,
				rsvps: [{ athleteId: "ath_2", status: "yes" }],
			},
			{ athleteId: "ath_me", audienceIds },
		);
		expect(dto.volunteer).toEqual({ filled: 1, spots: 2, signedUp: false });
	});
});
