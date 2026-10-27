import { describe, expect, it } from "vitest";
import { getChatTargets } from "./targets";

const mike = {
	id: "user_mike",
	name: "Mike Tran",
	initials: "MT",
	isCoach: false,
};
const sarah = {
	id: "user_sarah",
	name: "Sarah Kowalski",
	initials: "SK",
	isCoach: false,
};
const channels = [
	{
		id: "chan_everyone",
		name: "Everyone",
		kind: "everyone" as const,
		members: [],
	},
	{ id: "chan_masters", name: "Masters", kind: "group" as const, members: [] },
	{
		id: "chan_dm_mike",
		name: "Mike Tran",
		kind: "direct_message" as const,
		members: [mike],
	},
	{
		id: "chan_dm_both",
		name: "Mike, Sarah",
		kind: "direct_message" as const,
		members: [mike, sarah],
	},
];
const members = [mike, sarah];

describe("getChatTargets", () => {
	it("lists other channels, then members without a DM", () => {
		const targets = getChatTargets({
			channels,
			members,
			sourceChannelId: "chan_everyone",
		});
		expect(targets.map((target) => target.key)).toEqual([
			"channel:chan_masters",
			"channel:chan_dm_mike",
			"channel:chan_dm_both",
			"member:user_sarah",
		]);
	});

	it("treats only one-to-one DMs as an existing DM with that member", () => {
		const targets = getChatTargets({
			channels,
			members,
			sourceChannelId: "chan_dm_mike",
		});
		expect(targets.map((target) => target.name)).toEqual([
			"Everyone",
			"Masters",
			"Mike, Sarah",
			"Sarah Kowalski",
		]);
	});

	it("offers members when Everyone is the only channel", () => {
		const targets = getChatTargets({
			channels: channels.slice(0, 1),
			members,
			sourceChannelId: "chan_everyone",
		});
		expect(targets).toEqual([
			{
				key: "member:user_mike",
				name: "Mike Tran",
				kind: "direct_message",
				userId: "user_mike",
			},
			{
				key: "member:user_sarah",
				name: "Sarah Kowalski",
				kind: "direct_message",
				userId: "user_sarah",
			},
		]);
	});
});
