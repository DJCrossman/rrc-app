import { describe, expect, it } from "vitest";
import {
	buildLinkPreviews,
	type LinkedActivityRow,
	type LinkedEventRow,
} from "./link-previews";

const event: LinkedEventRow = {
	id: "evt_1",
	type: "training",
	title: "Masters on-water",
	startAt: new Date("2026-10-27T12:15:00Z"),
	endAt: new Date("2026-10-27T13:45:00Z"),
	allDay: false,
	timezone: "America/Regina",
	location: "Wascana Boathouse",
};

const activity: LinkedActivityRow = {
	id: "act_1",
	name: "Morning row",
	type: "water",
	startDate: new Date("2026-10-25T12:00:00Z"),
	timezone: "America/Regina",
	distance: 8000,
	elapsedTime: 2_400_000,
	athlete: {
		userId: "user_mike",
		firstName: "Mike",
		lastName: "Tran",
		nickname: null,
	},
};

const build = (
	targets: Parameters<typeof buildLinkPreviews>[0]["targets"],
	authorUserId: string,
	viewerUserId: string,
) =>
	buildLinkPreviews({
		targets,
		eventsById: new Map([[event.id, event]]),
		activitiesById: new Map([[activity.id, activity]]),
		authorUserId,
		viewerUserId,
	});

describe("buildLinkPreviews", () => {
	it("previews an event for anyone, in the event's timezone", () => {
		expect(
			build([{ kind: "event", id: "evt_1" }], "user_sarah", "user_dave"),
		).toEqual([
			{
				kind: "event",
				id: "evt_1",
				title: "Masters on-water",
				type: "training",
				typeLabel: "Training",
				dateLabel: "Tuesday, Oct 27",
				timeLabel: "6:15 – 7:45 AM",
				location: "Wascana Boathouse",
				url: "/schedule?eventId=evt_1",
			},
		]);
	});

	it("previews an activity shared by its owner, linking only for the owner", () => {
		const [forOwner] = build(
			[{ kind: "activity", id: "act_1" }],
			"user_mike",
			"user_mike",
		);
		const [forOthers] = build(
			[{ kind: "activity", id: "act_1" }],
			"user_mike",
			"user_dave",
		);
		expect(forOwner).toMatchObject({
			kind: "activity",
			name: "Morning row",
			athleteName: "Mike Tran",
			dateLabel: "Sunday, Oct 25",
			url: "/activities?activityId=act_1",
		});
		expect(forOthers).toMatchObject({ kind: "activity", url: null });
	});

	it("skips someone else's activity and links that no longer exist", () => {
		expect(
			build(
				[
					{ kind: "activity", id: "act_1" },
					{ kind: "event", id: "evt_gone" },
				],
				"user_sarah",
				"user_sarah",
			),
		).toEqual([]);
	});
});
