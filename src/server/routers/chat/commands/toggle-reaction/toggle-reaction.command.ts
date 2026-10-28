import type { ToggleReaction } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { findAccessibleMessage } from "@/server/routers/chat/common/chat-access";
import { TRPCError } from "@/server/trpc";

export async function toggleReactionCommand(
	input: ToggleReaction,
	{ db, user }: ViewerContext,
) {
	const message = await findAccessibleMessage(db, input.messageId, user);
	if (message.deletedAt) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This message was deleted",
		});
	}
	const reaction = {
		messageId: message.id,
		userId: user.id,
		emoji: input.emoji,
	};
	const { count } = await db.message_reaction.deleteMany({ where: reaction });
	if (count > 0) {
		return { reacted: false };
	}
	await db.message_reaction.createMany({
		data: [reaction],
		skipDuplicates: true,
	});
	return { reacted: true };
}
