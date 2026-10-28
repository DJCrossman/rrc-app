import type { DeleteMessage } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import {
	findAccessibleMessage,
	isChatAdmin,
} from "@/server/routers/chat/common/chat-access";
import { TRPCError } from "@/server/trpc";

export async function deleteMessageCommand(
	input: DeleteMessage,
	ctx: ViewerContext,
) {
	const { db, user } = ctx;
	const message = await findAccessibleMessage(ctx, input.messageId);
	if (message.authorUserId !== user.id && !isChatAdmin(ctx)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You can only delete your own messages",
		});
	}
	if (!message.deletedAt) {
		await db.message.update({
			where: { id: message.id },
			data: { deletedAt: new Date() },
		});
	}
	return {
		messageId: message.id,
		channelId: message.channelId,
		parentId: message.parentId,
	};
}
