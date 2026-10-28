import type { MarkUnread } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { findAccessibleMessage } from "@/server/routers/chat/common/chat-access";
import { readMarkerBefore } from "@/server/routers/chat/common/unread";

export async function markUnreadCommand(input: MarkUnread, ctx: ViewerContext) {
	const { db, user } = ctx;
	const message = await findAccessibleMessage(ctx, input.messageId);
	const lastReadAt = readMarkerBefore((message.parent ?? message).createdAt);
	await db.channel_read.upsert({
		where: {
			channelId_userId: { channelId: message.channelId, userId: user.id },
		},
		create: { channelId: message.channelId, userId: user.id, lastReadAt },
		update: { lastReadAt },
	});
	return {
		channelId: message.channelId,
		lastReadAt: lastReadAt.toISOString(),
	};
}
