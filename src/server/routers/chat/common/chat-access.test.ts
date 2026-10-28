import { describe, expect, it } from "vitest";
import { type ChannelViewer, canAccessChannel } from "./chat-access";

const member: ChannelViewer = {
	userId: "user_me",
	isAdmin: false,
	groupIds: new Set(["grp_masters"]),
};

const channel = (
	kind: "everyone" | "group" | "direct_message",
	{
		groupId = null,
		userIds = [],
	}: { groupId?: string | null; userIds?: string[] } = {},
) => ({
	kind,
	groupId,
	members: userIds.map((userId) => ({ userId })),
});

describe("canAccessChannel", () => {
	it("opens the everyone channel to all", () => {
		expect(
			canAccessChannel(channel("everyone"), { ...member, groupIds: new Set() }),
		).toBe(true);
	});

	it("opens a group channel only to the group's members", () => {
		expect(
			canAccessChannel(channel("group", { groupId: "grp_masters" }), member),
		).toBe(true);
		expect(
			canAccessChannel(channel("group", { groupId: "grp_juniors" }), member),
		).toBe(false);
	});

	it("lets admins into every group channel", () => {
		expect(
			canAccessChannel(channel("group", { groupId: "grp_juniors" }), {
				...member,
				isAdmin: true,
			}),
		).toBe(true);
	});

	it("keeps direct messages to their members, admins included", () => {
		const dm = channel("direct_message", { userIds: ["user_me", "user_b"] });
		expect(canAccessChannel(dm, member)).toBe(true);
		expect(
			canAccessChannel(dm, { ...member, userId: "user_c", isAdmin: true }),
		).toBe(false);
	});
});
