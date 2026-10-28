import type { ChannelKind } from "@/generated/prisma/client";
import { EVERYONE_CHANNEL_ID } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { getViewerGroups, isViewerAdmin } from "@/server/routers/groups/common";
import { TRPCError } from "@/server/trpc";

type Db = ViewerContext["db"];

type AccessibleChannel = {
	kind: ChannelKind;
	groupId: string | null;
	members: { userId: string; visibleFrom?: Date | null }[];
};

export type ChannelViewer = {
	userId: string;
	isAdmin: boolean;
	/** The groups whose chats the viewer is in. */
	groupIds: ReadonlySet<string>;
};

const channelAccessInclude = {
	members: { select: { userId: true, visibleFrom: true } },
} as const;

export async function findAccessibleChannel(
	ctx: ViewerContext,
	channelId: string,
) {
	const { db } = ctx;
	const channel =
		(await db.channel.findUnique({
			where: { id: channelId },
			include: channelAccessInclude,
		})) ??
		(channelId === EVERYONE_CHANNEL_ID
			? await ensureEveryoneChannel(db)
			: null);
	if (!channel || !(await canViewerAccess(ctx, channel))) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found" });
	}
	return channel;
}

export async function findAccessibleMessage(
	ctx: ViewerContext,
	messageId: string,
) {
	const { db, user } = ctx;
	const message = await db.message.findUnique({
		where: { id: messageId },
		include: {
			channel: { include: channelAccessInclude },
			parent: { select: { createdAt: true } },
		},
	});
	if (
		!message ||
		!(await canViewerAccess(ctx, message.channel)) ||
		!isVisibleToMember(
			message.parent ?? message,
			getVisibleFrom(message.channel, user.id),
		)
	) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
	}
	return message;
}

// Direct messages never depend on the viewer's groups, so this skips the
// group lookup that findAccessibleChannel would do.
export async function findMyDm(db: Db, channelId: string, userId: string) {
	const channel = await db.channel.findUnique({
		where: { id: channelId },
		include: channelAccessInclude,
	});
	if (
		!channel ||
		(channel.kind === "direct_message" &&
			!channel.members.some((member) => member.userId === userId))
	) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found" });
	}
	if (channel.kind !== "direct_message") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Only direct messages have their own members",
		});
	}
	return channel;
}

export function canAccessChannel(
	channel: AccessibleChannel,
	viewer: ChannelViewer,
) {
	switch (channel.kind) {
		case "everyone":
			return true;
		case "group":
			return (
				viewer.isAdmin ||
				(channel.groupId !== null && viewer.groupIds.has(channel.groupId))
			);
		case "direct_message":
			return channel.members.some((member) => member.userId === viewer.userId);
	}
}

export async function getChannelViewer(
	ctx: ViewerContext,
): Promise<ChannelViewer> {
	const groups = await getViewerGroups(ctx);
	return groups.isAdmin
		? { userId: ctx.user.id, isAdmin: true, groupIds: new Set() }
		: { userId: ctx.user.id, isAdmin: false, groupIds: groups.groupIds };
}

// Only group channels need the viewer's groups, so skip looking them up for
// everything else.
async function canViewerAccess(ctx: ViewerContext, channel: AccessibleChannel) {
	const viewer =
		channel.kind === "group"
			? await getChannelViewer(ctx)
			: { userId: ctx.user.id, isAdmin: false, groupIds: new Set<string>() };
	return canAccessChannel(channel, viewer);
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

export function isChatAdmin(ctx: ViewerContext) {
	return isViewerAdmin(ctx);
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
