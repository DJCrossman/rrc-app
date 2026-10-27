import type { Prisma } from "@/generated/prisma/client";

type ChannelRead = { channelId: string; lastReadAt: Date };

export function buildUnreadMessageWhere({
	userId,
	channelIds,
	reads,
	visibleFromByChannel = new Map(),
}: {
	userId: string;
	channelIds: string[];
	reads: ChannelRead[];
	visibleFromByChannel?: Map<string, Date>;
}): Prisma.messageWhereInput {
	const lastReadAtByChannel = new Map(
		reads.map((read) => [read.channelId, read.lastReadAt]),
	);
	return {
		parentId: null,
		deletedAt: null,
		authorUserId: { not: userId },
		OR: channelIds.map((channelId) => {
			const lastReadAt = lastReadAtByChannel.get(channelId);
			const visibleFrom = visibleFromByChannel.get(channelId);
			return {
				channelId,
				...(lastReadAt || visibleFrom
					? {
							createdAt: {
								...(lastReadAt ? { gt: lastReadAt } : {}),
								...(visibleFrom ? { gte: visibleFrom } : {}),
							},
						}
					: {}),
			};
		}),
	};
}

export function toUnreadCounts(
	channelIds: string[],
	groups: { channelId: string; _count: { _all: number } }[],
) {
	const counts = new Map(
		groups.map((group) => [group.channelId, group._count._all]),
	);
	return new Map(channelIds.map((id) => [id, counts.get(id) ?? 0]));
}

export function readMarkerBefore(createdAt: Date) {
	return new Date(createdAt.getTime() - 1);
}
