import type { ChannelKind, Prisma } from "@/generated/prisma/client";
import { type ChatUser, getChatUser } from "./chat-user-names";

const PREVIEW_LENGTH = 140;
const MAX_NAMED_DM_MEMBERS = 3;
const KIND_ORDER: Record<ChannelKind, number> = {
	everyone: 0,
	group: 1,
	direct_message: 2,
};

export const channelInclude = {
	members: {
		select: { userId: true, visibleFrom: true },
		orderBy: { createdAt: "asc" },
	},
} as const satisfies Prisma.channelInclude;

export type ChannelRow = Prisma.channelGetPayload<{
	include: typeof channelInclude;
}>;

export type LastMessageRow = {
	channelId: string;
	authorUserId: string;
	text: string | null;
	gif: string | null;
	forwardedFromId: string | null;
	createdAt: Date;
};

export function mapToChannelDto(
	channel: ChannelRow,
	{
		userId,
		users,
		memberCount,
		unreadCount,
		lastMessage,
		groupNames = new Map(),
	}: {
		userId: string;
		users: Map<string, ChatUser>;
		memberCount: number;
		unreadCount: number;
		lastMessage: LastMessageRow | null;
		groupNames?: Map<string, string>;
	},
) {
	const visibleFrom = channel.members.find(
		(member) => member.userId === userId,
	)?.visibleFrom;
	const shownLastMessage =
		lastMessage && visibleFrom && lastMessage.createdAt < visibleFrom
			? null
			: lastMessage;
	const otherMembers =
		channel.kind === "direct_message"
			? channel.members.filter((member) => member.userId !== userId)
			: [];
	const others = otherMembers.map((member) =>
		getChatUser(users, member.userId),
	);
	return {
		id: channel.id,
		kind: channel.kind,
		groupId: channel.groupId,
		name:
			channel.kind === "direct_message"
				? getDmName(others)
				: ((channel.groupId && groupNames.get(channel.groupId)) ??
					getChannelName(channel)),
		initials: others.length === 1 ? others[0].initials : null,
		members: others,
		hasOnlyFormerMembers:
			otherMembers.length > 0 &&
			otherMembers.every((member) => !users.has(member.userId)),
		memberCount:
			channel.kind === "direct_message" ? channel.members.length : memberCount,
		unreadCount,
		lastMessage: shownLastMessage
			? {
					authorName: getChatUser(users, shownLastMessage.authorUserId).name,
					isMine: shownLastMessage.authorUserId === userId,
					preview: getMessagePreview(shownLastMessage),
					createdAt: new Date(shownLastMessage.createdAt).toISOString(),
				}
			: null,
		lastActivityAt: new Date(
			shownLastMessage?.createdAt ?? visibleFrom ?? channel.createdAt,
		).toISOString(),
	};
}

export type ChannelDto = ReturnType<typeof mapToChannelDto>;

export function getChannelName(channel: {
	kind: ChannelKind;
	groupId: string | null;
}) {
	switch (channel.kind) {
		case "everyone":
			return "Everyone";
		case "group":
			return getGroupChannelPlaceholderName(channel.groupId);
		case "direct_message":
			return "Direct message";
	}
}

export function getDmName(others: Pick<ChatUser, "name">[]) {
	if (others.length === 0) return "Just you";
	if (others.length === 1) return others[0].name;
	const firstNames = others.map((user) => user.name.split(" ")[0]);
	const named = firstNames.slice(0, MAX_NAMED_DM_MEMBERS).join(", ");
	const rest = firstNames.length - MAX_NAMED_DM_MEMBERS;
	return rest > 0 ? `${named} +${rest}` : named;
}

export function getForwardSourceName(channel: {
	kind: ChannelKind;
	groupId: string | null;
}) {
	return channel.kind === "direct_message"
		? "a direct message"
		: getChannelName(channel);
}

export function getGroupChannelPlaceholderName(groupId: string | null) {
	const suffix = (groupId ?? "").replace(/^grp_/, "").slice(0, 6);
	return suffix ? `Group ${suffix}` : "Group";
}

export function getMessagePreview(message: {
	text: string | null;
	gif: string | null;
	forwardedFromId: string | null;
}) {
	if (message.text) return message.text.slice(0, PREVIEW_LENGTH);
	if (message.gif) return `GIF: ${message.gif}`;
	if (message.forwardedFromId) return "Forwarded a message";
	return "";
}

export function sortChannels(channels: ChannelDto[]) {
	return [...channels].sort((a, b) => {
		if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
		if (a.kind === "direct_message")
			return b.lastActivityAt.localeCompare(a.lastActivityAt);
		return a.name.localeCompare(b.name);
	});
}
