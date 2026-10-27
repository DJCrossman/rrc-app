import { Prisma } from "@/generated/prisma/client";
import { paginate } from "@/lib/pagination";
import type { ViewerContext } from "@/server/context";
import { ensureEveryoneChannel } from "@/server/routers/chat/common/chat-access";
import { loadChatUsers } from "@/server/routers/chat/common/chat-users";
import {
	channelInclude,
	type LastMessageRow,
	mapToChannelDto,
	sortChannels,
} from "@/server/routers/chat/common/map-to-channel-dto";
import {
	buildUnreadMessageWhere,
	toUnreadCounts,
} from "@/server/routers/chat/common/unread";

type Db = ViewerContext["db"];

export async function getChannelsQuery(
	_input: undefined,
	{ db, user }: ViewerContext,
) {
	const [channels, reads, memberCount] = await Promise.all([
		findVisibleChannels(db, user.id),
		db.channel_read.findMany({
			where: { userId: user.id },
			select: { channelId: true, lastReadAt: true },
		}),
		db.athlete.count(),
	]);
	const channelIds = channels.map((channel) => channel.id);
	const groupIds = channels.flatMap((channel) =>
		channel.groupId ? [channel.groupId] : [],
	);
	const [unreadGroups, lastMessages, groups] = await Promise.all([
		db.message.groupBy({
			by: ["channelId"],
			where: buildUnreadMessageWhere({
				userId: user.id,
				channelIds,
				reads,
				visibleFromByChannel: getMyVisibleFrom(channels, user.id),
			}),
			_count: { _all: true },
		}),
		findLastMessages(db, channelIds),
		db.group.findMany({
			where: { id: { in: groupIds } },
			select: { id: true, name: true },
		}),
	]);
	const groupNames = new Map(groups.map((group) => [group.id, group.name]));
	const users = await loadChatUsers(db, [
		...channels.flatMap((channel) =>
			channel.members.map((member) => member.userId),
		),
		...lastMessages.map((message) => message.authorUserId),
	]);
	const unreadCounts = toUnreadCounts(channelIds, unreadGroups);
	const lastMessageByChannel = new Map(
		lastMessages.map((message) => [message.channelId, message]),
	);

	const data = sortChannels(
		channels.map((channel) =>
			mapToChannelDto(channel, {
				userId: user.id,
				users,
				memberCount,
				unreadCount: unreadCounts.get(channel.id) ?? 0,
				lastMessage: lastMessageByChannel.get(channel.id) ?? null,
				groupNames,
			}),
		),
	);
	return paginate({ data, totalCount: data.length });
}

async function findVisibleChannels(db: Db, userId: string) {
	const where = {
		OR: [
			{ kind: { in: ["everyone", "group"] } },
			{ kind: "direct_message", members: { some: { userId } } },
		],
	} satisfies Prisma.channelWhereInput;
	const channels = await db.channel.findMany({
		where,
		include: channelInclude,
	});
	if (channels.some((channel) => channel.kind === "everyone")) {
		return channels;
	}
	await ensureEveryoneChannel(db);
	return db.channel.findMany({ where, include: channelInclude });
}

function getMyVisibleFrom(
	channels: Awaited<ReturnType<typeof findVisibleChannels>>,
	userId: string,
) {
	return new Map(
		channels.flatMap((channel) => {
			const visibleFrom = channel.members.find(
				(member) => member.userId === userId,
			)?.visibleFrom;
			return visibleFrom ? [[channel.id, visibleFrom] as const] : [];
		}),
	);
}

async function findLastMessages(db: Db, channelIds: string[]) {
	if (channelIds.length === 0) return [];
	return db.$queryRaw<LastMessageRow[]>`
		SELECT DISTINCT ON (m."channelId")
			m."channelId", m."authorUserId", m."text", m."gif", m."forwardedFromId", m."createdAt"
		FROM "message" m
		WHERE m."channelId" IN (${Prisma.join(channelIds)})
			AND m."parentId" IS NULL
			AND m."deletedAt" IS NULL
		ORDER BY m."channelId", m."createdAt" DESC
	`;
}
