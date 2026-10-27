import { describe, expect, it } from "vitest";
import { findExactDm, getVisibleFrom, isVisibleToMember } from "./chat-access";
import {
	getChatUser,
	getDisplayName,
	getInitials,
	toChatUser,
} from "./chat-user-names";
import { getDmName, mapToChannelDto } from "./map-to-channel-dto";

const named = (...names: string[]) => names.map((name) => ({ name }));

describe("getDmName", () => {
	it("uses the full name for one person and first names for a group", () => {
		expect(getDmName(named("Mike Tran"))).toBe("Mike Tran");
		expect(getDmName(named("Mike Tran", "Sarah Kowalski"))).toBe("Mike, Sarah");
		expect(
			getDmName(
				named("Mike Tran", "Sarah K", "Priya Shah", "Tom Ward", "Ana Ruiz"),
			),
		).toBe("Mike, Sarah, Priya +2");
		expect(getDmName([])).toBe("Just you");
	});
});

describe("findExactDm", () => {
	const dm = (id: string, ...userIds: string[]) => ({
		id,
		members: userIds.map((userId) => ({ userId })),
	});

	it("reopens only a conversation with exactly the same people", () => {
		const candidates = [dm("a", "me", "mike", "sarah"), dm("b", "me", "mike")];
		expect(findExactDm(candidates, ["me", "mike"])?.id).toBe("b");
		expect(findExactDm(candidates, ["sarah", "me", "mike"])?.id).toBe("a");
		expect(findExactDm(candidates, ["me", "sarah"])).toBeUndefined();
	});
});

describe("chat user names", () => {
	it("prefers nicknames and copes with missing Clerk names", () => {
		expect(
			getDisplayName({
				firstName: "Michael",
				lastName: "Tran",
				nickname: "Mike",
			}),
		).toBe("Mike Tran");
		expect(
			getInitials({ firstName: "Michael", lastName: "Tran", nickname: "Mike" }),
		).toBe("MT");
		expect(getDisplayName({ firstName: null, lastName: null })).toBe(
			"Club member",
		);
		expect(getInitials({ firstName: "Ada", lastName: null })).toBe("A");
	});

	it("builds admin users from Clerk names and falls back for unknown IDs", () => {
		expect(
			toChatUser("user_admin", { firstName: "Dana", lastName: "Fox" }, true),
		).toEqual({
			id: "user_admin",
			name: "Dana Fox",
			initials: "DF",
			isCoach: true,
		});
		expect(getChatUser(new Map(), "user_gone").name).toBe("Former member");
	});
});

describe("history visibility for people added later", () => {
	const joinedAt = new Date("2026-10-27T12:00:00Z");
	const before = new Date("2026-10-27T11:00:00Z");
	const after = new Date("2026-10-27T13:00:00Z");
	const channel = {
		id: "chan_dm",
		kind: "direct_message" as const,
		groupId: null,
		createdAt: new Date("2026-10-01T00:00:00Z"),
		members: [
			{ userId: "me", visibleFrom: null },
			{ userId: "new", visibleFrom: joinedAt },
		],
	};
	const lastMessage = {
		channelId: "chan_dm",
		authorUserId: "me",
		text: "Earlier plans",
		gif: null,
		forwardedFromId: null,
		createdAt: before,
	};
	const map = (userId: string) =>
		mapToChannelDto(channel, {
			userId,
			users: new Map(),
			memberCount: 2,
			unreadCount: 0,
			lastMessage,
		});

	it("reads each member's own start date", () => {
		expect(getVisibleFrom(channel, "new")).toEqual(joinedAt);
		expect(getVisibleFrom(channel, "me")).toBeNull();
	});

	it("hides threads that started before the member joined", () => {
		expect(isVisibleToMember({ createdAt: before }, joinedAt)).toBe(false);
		expect(isVisibleToMember({ createdAt: after }, joinedAt)).toBe(true);
		expect(isVisibleToMember({ createdAt: before }, null)).toBe(true);
	});

	it("hides an earlier last message from the sidebar preview", () => {
		expect(map("new").lastMessage).toBeNull();
		expect(map("new").lastActivityAt).toBe(joinedAt.toISOString());
		expect(map("me").lastMessage?.preview).toBe("Earlier plans");
	});
});
