import { describe, expect, it } from "vitest";
import { buildNudgeMessage } from "./send-nudge";

const event = {
	id: "evt_1",
	type: "training" as const,
	title: "Long row",
	startAt: new Date("2026-10-27T12:00:00.000Z"),
	endAt: new Date("2026-10-27T13:30:00.000Z"),
	allDay: false,
	timezone: "America/Regina",
};

describe("buildNudgeMessage", () => {
	it("asks whether they're coming, with the session's day and time", () => {
		const message = buildNudgeMessage(event);
		expect(message.title).toBe("Are you coming?");
		expect(message.body).toBe("Long row — Tue Oct 27, 6:00 – 7:30 AM");
	});

	it("asks for help with a volunteer shift", () => {
		expect(buildNudgeMessage({ ...event, type: "volunteer" }).title).toBe(
			"Can you help?",
		);
	});

	it("opens the event so they can reply in one tap", () => {
		const message = buildNudgeMessage(event);
		expect(message.url).toBe("/schedule?eventId=evt_1");
		expect(message.scope).toBe("schedule");
	});

	it("replaces an earlier nudge for the same event", () => {
		expect(buildNudgeMessage(event).tag).toBe("nudge-evt_1");
	});
});
