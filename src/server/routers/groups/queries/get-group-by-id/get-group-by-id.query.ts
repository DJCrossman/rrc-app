import type { GetGroupByIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import {
	ensureGroupChannel,
	isChatAdmin,
} from "@/server/routers/chat/common/chat-access";
import { getGroupMembers } from "../../common/group-members";
import {
	groupInclude,
	mapToGroupDto,
	mapToGroupMemberDto,
} from "../../common/map-to-group-dto";

export async function getGroupByIdQuery(
	input: GetGroupByIdInput,
	ctx: ViewerContext,
) {
	const { db, athlete } = ctx;
	const row = await db.group.findUnique({
		where: { id: input.id },
		include: groupInclude,
	});
	if (!row) return null;

	const [members, channel] = await Promise.all([
		getGroupMembers(db, row.id),
		ensureGroupChannel(db, row.id),
	]);
	const ruleProgramIds = new Set(row.programs.map((p) => p.programId));

	return {
		...mapToGroupDto(row, members.length),
		channelId: channel.id,
		canChat: isChatAdmin(ctx) || members.some(({ id }) => id === athlete?.id),
		members: members.map((athlete) =>
			mapToGroupMemberDto(athlete, ruleProgramIds),
		),
	};
}
