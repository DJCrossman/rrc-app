import type { ForwardMessage } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import {
	findAccessibleChannel,
	findAccessibleMessage,
} from "@/server/routers/chat/common/chat-access";
import { resolveForwardSourceId } from "@/server/routers/chat/common/map-to-message-dto";
import { TRPCError } from "@/server/trpc";

export async function forwardMessageCommand(
	input: ForwardMessage,
	{ db, user }: ViewerContext,
) {
	const [source, target] = await Promise.all([
		findAccessibleMessage(db, input.messageId, user.id),
		findAccessibleChannel(db, input.targetChannelId, user.id),
	]);
	if (source.deletedAt) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This message was deleted",
		});
	}
	const message = await db.message.create({
		data: {
			channelId: target.id,
			authorUserId: user.id,
			text: input.note || null,
			forwardedFromId: resolveForwardSourceId(source),
		},
		select: { id: true, channelId: true },
	});
	return { messageId: message.id, channelId: message.channelId };
}
