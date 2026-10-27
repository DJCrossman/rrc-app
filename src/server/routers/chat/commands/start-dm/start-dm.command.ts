import type { StartDm } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { findExactDm } from "@/server/routers/chat/common/chat-access";
import { assertKnownChatUsers } from "@/server/routers/chat/common/chat-users";
import { TRPCError } from "@/server/trpc";

export async function startDmCommand(
	input: StartDm,
	{ db, user }: ViewerContext,
) {
	if (input.userIds.includes(user.id)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "You're already part of the conversation",
		});
	}
	await assertKnownChatUsers(db, input.userIds);
	const memberIds = [user.id, ...input.userIds];
	const candidates = await db.channel.findMany({
		where: {
			kind: "direct_message",
			AND: memberIds.map((id) => ({ members: { some: { userId: id } } })),
		},
		select: { id: true, members: { select: { userId: true } } },
	});
	const existing = findExactDm(candidates, memberIds);
	if (existing) {
		return { channelId: existing.id };
	}
	const channel = await db.channel.create({
		data: {
			kind: "direct_message",
			members: {
				create: memberIds.map((id) => ({ userId: id, addedByUserId: user.id })),
			},
		},
		select: { id: true },
	});
	return { channelId: channel.id };
}
