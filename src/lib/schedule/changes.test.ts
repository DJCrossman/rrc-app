import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
	buildScheduleChangeMessage,
	countNotifiable,
	detectScheduleChange,
	planScheduleNotifications,
	type ScheduleChange,
	type SessionSnapshot,
} from "./changes";

const now = DateTime.fromISO("2026-10-24T12:00:00.000-06:00");

const session = (
	overrides: Partial<SessionSnapshot> = {},
): SessionSnapshot => ({
	id: "evt_1",
	type: "training",
	startAt: "2026-10-27T06:00:00.000-06:00",
	location: "Wascana",
	timezone: "America/Regina",
	...overrides,
});

const change = (overrides: Partial<ScheduleChange> = {}): ScheduleChange => ({
	eventId: "evt_1",
	type: "training",
	cancelled: false,
	weekStart: "2026-10-25",
	...overrides,
});

describe("detectScheduleChange", () => {
	it("reports a cancelled upcoming session", () => {
		expect(detectScheduleChange(session(), null, now)).toEqual(
			change({ cancelled: true }),
		);
	});

	it("reports a session moved to a new time", () => {
		const moved = session({ startAt: "2026-10-27T17:00:00.000-06:00" });
		expect(detectScheduleChange(session(), moved, now)).toEqual(change());
	});

	it("reports a change of location", () => {
		const relocated = session({ location: "Boathouse" });
		expect(detectScheduleChange(session(), relocated, now)).toEqual(change());
	});

	it("ignores edits that leave the time and place alone", () => {
		expect(detectScheduleChange(session(), session(), now)).toBeNull();
	});

	it("ignores stray seconds on an unchanged start", () => {
		const same = session({ startAt: "2026-10-27T06:00:45.000-06:00" });
		expect(detectScheduleChange(session(), same, now)).toBeNull();
	});

	it("stays silent about sessions that have already started", () => {
		const past = session({ startAt: "2026-10-23T06:00:00.000-06:00" });
		expect(detectScheduleChange(past, null, now)).toBeNull();
	});

	it("files a move under the week the session lands in", () => {
		const nextWeek = session({ startAt: "2026-11-02T06:00:00.000-06:00" });
		expect(detectScheduleChange(session(), nextWeek, now)?.weekStart).toBe(
			"2026-11-01",
		);
	});
});

describe("buildScheduleChangeMessage", () => {
	it("summarises a single change", () => {
		expect(buildScheduleChangeMessage([change()]).title).toBe(
			"A practice for the week of Oct 25 has changed",
		);
	});

	it("counts several changes without implying the whole week moved", () => {
		expect(
			buildScheduleChangeMessage([change(), change({ eventId: "evt_2" })])
				.title,
		).toBe("2 practices for the week of Oct 25 have changed");
	});

	it("says cancelled only when every change is a cancellation", () => {
		expect(
			buildScheduleChangeMessage([change({ cancelled: true })]).title,
		).toBe("A practice for the week of Oct 25 has been cancelled");
		expect(
			buildScheduleChangeMessage([
				change({ cancelled: true }),
				change({ eventId: "evt_2" }),
			]).title,
		).toBe("2 practices for the week of Oct 25 have changed");
	});

	it("calls them events once anything other than training is involved", () => {
		expect(
			buildScheduleChangeMessage([change({ type: "regatta" })]).title,
		).toBe("An event for the week of Oct 25 has changed");
	});

	it("opens the affected week, under the schedule notification scope", () => {
		const message = buildScheduleChangeMessage([change()]);
		expect(message.url).toBe("/schedule?week=2026-10-25");
		expect(message.scope).toBe("schedule");
	});
});

describe("planScheduleNotifications", () => {
	it("sends one summary per athlete, however many of their sessions changed", () => {
		const plans = planScheduleNotifications(
			[change(), change({ eventId: "evt_2" })],
			new Map([
				["evt_1", ["ath_a", "ath_b"]],
				["evt_2", ["ath_a"]],
			]),
		);
		const titleFor = (athleteId: string) =>
			plans.find((plan) => plan.athleteIds.includes(athleteId))?.message.title;
		expect(titleFor("ath_a")).toBe(
			"2 practices for the week of Oct 25 have changed",
		);
		expect(titleFor("ath_b")).toBe(
			"A practice for the week of Oct 25 has changed",
		);
		expect(plans.flatMap((plan) => plan.athleteIds).sort()).toEqual([
			"ath_a",
			"ath_b",
		]);
	});

	it("shares one send between athletes who get the same summary", () => {
		const plans = planScheduleNotifications(
			[change()],
			new Map([["evt_1", ["ath_a", "ath_b", "ath_c"]]]),
		);
		expect(plans).toHaveLength(1);
		expect(plans[0].athleteIds).toEqual(["ath_a", "ath_b", "ath_c"]);
	});

	it("sends nothing when nobody is interested", () => {
		expect(planScheduleNotifications([change()], new Map())).toEqual([]);
	});
});

describe("countNotifiable", () => {
	const counts = { going: 4, maybe: 2 };

	it("counts going and maybe for an upcoming event", () => {
		expect(
			countNotifiable(
				{ startAt: "2026-10-27T06:00:00.000-06:00", counts },
				now,
			),
		).toBe(6);
	});

	it("is zero once the event has started", () => {
		expect(
			countNotifiable(
				{ startAt: "2026-10-23T06:00:00.000-06:00", counts },
				now,
			),
		).toBe(0);
	});
});
