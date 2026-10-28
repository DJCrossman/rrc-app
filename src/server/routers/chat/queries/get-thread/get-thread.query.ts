import type { GetThreadInput } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { findAccessibleMessage } from "@/server/routers/chat/common/chat-access";
import { loadMessageDtos } from "@/server/routers/chat/common/load-message-dtos";
import { messageInclude } from "@/server/routers/chat/common/map-to-message-dto";

export async function getThreadQuery(
	input: GetThreadInput,
	ctx: ViewerContext,
) {
	const { db } = ctx;
	const message = await findAccessibleMessage(ctx, input.messageId);
	const rootId = message.parentId ?? message.id;
	const [root, replies] = await Promise.all([
		db.message.findUniqueOrThrow({
			where: { id: rootId },
			include: messageInclude,
		}),
		db.message.findMany({
			where: { parentId: rootId, deletedAt: null },
			include: messageInclude,
			orderBy: [{ createdAt: "asc" }, { id: "asc" }],
		}),
	]);
	const [rootDto, ...replyDtos] = await loadMessageDtos(ctx, [
		root,
		...replies,
	]);

	return { channelId: root.channelId, root: rootDto, replies: replyDtos };
}
