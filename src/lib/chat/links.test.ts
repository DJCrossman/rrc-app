import { describe, expect, it } from "vitest";
import { extractLinkTargets, splitTextByUrls } from "./links";

describe("splitTextByUrls", () => {
	it("splits absolute and relative URLs out of text and drops trailing punctuation", () => {
		expect(
			splitTextByUrls(
				"See https://club.app/schedule?eventId=evt_1. Also /activities?activityId=act_2!",
			),
		).toEqual([
			{ kind: "text", value: "See " },
			{ kind: "url", value: "https://club.app/schedule?eventId=evt_1" },
			{ kind: "text", value: ". Also " },
			{ kind: "url", value: "/activities?activityId=act_2" },
			{ kind: "text", value: "!" },
		]);
	});

	it("does not treat a slash inside a word as a link", () => {
		expect(splitTextByUrls("2k/6k splits")).toEqual([
			{ kind: "text", value: "2k/6k splits" },
		]);
	});
});

describe("extractLinkTargets", () => {
	it("finds event and activity links, including pasted ones with extra params", () => {
		expect(
			extractLinkTargets(
				"Practice http://localhost:3002/schedule?week=2026-10-25&eventId=evt_AbC1 and my piece https://club.app/activities?activityId=act_9z",
			),
		).toEqual([
			{ kind: "event", id: "evt_AbC1" },
			{ kind: "activity", id: "act_9z" },
		]);
	});

	it("ignores other pages, missing ids and duplicates", () => {
		expect(
			extractLinkTargets(
				"https://club.app/boats?boatId=boat_1 https://club.app/schedule /schedule?eventId=evt_1 /schedule?eventId=evt_1",
			),
		).toEqual([{ kind: "event", id: "evt_1" }]);
	});

	it("keeps at most three previews per message", () => {
		const text = ["a", "b", "c", "d"]
			.map((id) => `/schedule?eventId=evt_${id}`)
			.join(" ");
		expect(extractLinkTargets(text)).toHaveLength(3);
	});
});
