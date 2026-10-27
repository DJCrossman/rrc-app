import type { GetMessagesInput } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import {
	findAccessibleChannel,
	getVisibleFrom,
} from "@/server/routers/chat/common/chat-access";
import { loadMessageDtos } from "@/server/routers/chat/common/load-message-dtos";
import { messageInclude } from "@/server/routers/chat/common/map-to-message-dto";

export async function getMessagesQuery(
	input: GetMessagesInput,
	ctx: ViewerContext,
) {
	const { db, user } = ctx;
	const channel = await findAccessibleChannel(db, input.channelId, user.id);
	const visibleFrom = getVisibleFrom(channel, user.id);
	const [rows, read] = await Promise.all([
		db.message.findMany({
			where: {
				channelId: input.channelId,
				parentId: null,
				...(visibleFrom ? { createdAt: { gte: visibleFrom } } : {}),
				OR: [{ deletedAt: null }, { replies: { some: { deletedAt: null } } }],
			},
			include: messageInclude,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: input.limit + 1,
			...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
		}),
		db.channel_read.findUnique({
			where: {
				channelId_userId: { channelId: input.channelId, userId: user.id },
			},
			select: { lastReadAt: true },
		}),
	]);
	const page = rows.slice(0, input.limit);

	return {
		data: await loadMessageDtos(ctx, page),
		nextCursor: rows.length > input.limit ? (page.at(-1)?.id ?? null) : null,
		lastReadAt: read?.lastReadAt.toISOString() ?? null,
	};
}
