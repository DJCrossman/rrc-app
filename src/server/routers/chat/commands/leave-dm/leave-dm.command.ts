import type { LeaveDm } from "@/schemas/chat.schema";
import type { ViewerContext } from "@/server/context";
import { findMyDm } from "@/server/routers/chat/common/chat-access";
import { TRPCError } from "@/server/trpc";

const MIN_MEMBERS_TO_LEAVE = 3;

export async function leaveDmCommand(input: LeaveDm, ctx: ViewerContext) {
	const { db, user } = ctx;
	const channel = await findMyDm(ctx, input.channelId);
	if (channel.members.length < MIN_MEMBERS_TO_LEAVE) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "You can't leave a conversation between two people",
		});
	}
	await db.$transaction([
		db.channel_member.delete({
			where: { channelId_userId: { channelId: channel.id, userId: user.id } },
		}),
		db.channel_read.deleteMany({
			where: { channelId: channel.id, userId: user.id },
		}),
	]);
	return { channelId: channel.id };
}
