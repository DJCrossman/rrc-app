import type { ChannelKind } from "@/generated/prisma/client";
import { EVERYONE_CHANNEL_ID } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { TRPCError } from "@/server/trpc";

type Db = ViewerContext["db"];

type AccessibleChannel = {
	kind: ChannelKind;
	members: { userId: string; visibleFrom?: Date | null }[];
};

const channelAccessInclude = {
	members: { select: { userId: true, visibleFrom: true } },
} as const;

export async function findAccessibleChannel(
	db: Db,
	channelId: string,
	userId: string,
) {
	const channel =
		(await db.channel.findUnique({
			where: { id: channelId },
			include: channelAccessInclude,
		})) ??
		(channelId === EVERYONE_CHANNEL_ID
			? await ensureEveryoneChannel(db)
			: null);
	if (!channel || !canAccessChannel(channel, userId)) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found" });
	}
	return channel;
}

export async function findAccessibleMessage(
	db: Db,
	messageId: string,
	userId: string,
) {
	const message = await db.message.findUnique({
		where: { id: messageId },
		include: {
			channel: { include: channelAccessInclude },
			parent: { select: { createdAt: true } },
		},
	});
	if (
		!message ||
		!canAccessChannel(message.channel, userId) ||
		!isVisibleToMember(
			message.parent ?? message,
			getVisibleFrom(message.channel, userId),
		)
	) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
	}
	return message;
}

export async function findMyDm(db: Db, channelId: string, userId: string) {
	const channel = await findAccessibleChannel(db, channelId, userId);
	if (channel.kind !== "direct_message") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Only direct messages have their own members",
		});
	}
	return channel;
}

export function canAccessChannel(channel: AccessibleChannel, userId: string) {
	if (channel.kind === "direct_message") {
		return channel.members.some((member) => member.userId === userId);
	}
	return true;
}

export function getVisibleFrom(channel: AccessibleChannel, userId: string) {
	return (
		channel.members.find((member) => member.userId === userId)?.visibleFrom ??
		null
	);
}

export function isVisibleToMember(
	root: { createdAt: Date },
	visibleFrom: Date | null,
) {
	return !visibleFrom || root.createdAt >= visibleFrom;
}

export function ensureEveryoneChannel(db: Db) {
	return db.channel.upsert({
		where: { id: EVERYONE_CHANNEL_ID },
		create: { id: EVERYONE_CHANNEL_ID, kind: "everyone" },
		update: {},
		include: channelAccessInclude,
	});
}

export function ensureGroupChannel(db: Db, groupId: string) {
	return db.channel.upsert({
		where: { groupId },
		create: { kind: "group", groupId },
		update: {},
		select: { id: true },
	});
}

export function isChatAdmin({ user, athlete }: ViewerContext) {
	return user.isAdmin || athlete?.role === "admin";
}

export function findExactDm<T extends { members: { userId: string }[] }>(
	candidates: T[],
	userIds: string[],
) {
	const wanted = new Set(userIds);
	return candidates.find(
		(channel) =>
			channel.members.length === wanted.size &&
			channel.members.every((member) => wanted.has(member.userId)),
	);
}
