import type { SendMessage } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { findAccessibleChannel } from "@/server/routers/chat/common/chat-access";
import { loadMessageDtos } from "@/server/routers/chat/common/load-message-dtos";
import { messageInclude } from "@/server/routers/chat/common/map-to-message-dto";
import { TRPCError } from "@/server/trpc";

export async function sendMessageCommand(
	input: SendMessage,
	ctx: ViewerContext,
) {
	const { db, user } = ctx;
	await findAccessibleChannel(db, input.channelId, user.id);
	if (input.quotedMessageId) {
		await assertQuotable(ctx, input.quotedMessageId, input.channelId);
	}
	const message = await db.message.create({
		data: {
			channelId: input.channelId,
			authorUserId: user.id,
			text: input.text || null,
			gif: input.gif || null,
			quotedMessageId: input.quotedMessageId ?? null,
		},
		include: messageInclude,
	});
	const [dto] = await loadMessageDtos(ctx, [message]);
	return dto;
}

async function assertQuotable(
	{ db }: ViewerContext,
	messageId: string,
	channelId: string,
) {
	const quoted = await db.message.findUnique({
		where: { id: messageId },
		select: { channelId: true, deletedAt: true },
	});
	if (!quoted || quoted.channelId !== channelId || quoted.deletedAt) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "The quoted message is no longer available",
		});
	}
}
