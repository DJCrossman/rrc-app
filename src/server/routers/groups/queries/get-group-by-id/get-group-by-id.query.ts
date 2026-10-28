import type { GetGroupByIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import { ensureGroupChannel } from "@/server/routers/chat/common/chat-access";
import { getGroupMembers } from "../../common/group-members";
import {
	groupInclude,
	mapToGroupDto,
	mapToGroupMemberDto,
} from "../../common/map-to-group-dto";
import { canSeeGroup, getViewerGroups } from "../../common/viewer-groups";

export async function getGroupByIdQuery(
	input: GetGroupByIdInput,
	ctx: ViewerContext,
) {
	const { db } = ctx;
	const [row, viewer] = await Promise.all([
		db.group.findUnique({
			where: { id: input.id },
			include: groupInclude,
		}),
		getViewerGroups(ctx),
	]);
	if (!row || !canSeeGroup(viewer, row.id)) return null;

	const [members, channel] = await Promise.all([
		getGroupMembers(db, row.id),
		ensureGroupChannel(db, row.id),
	]);
	const ruleProgramIds = new Set(row.programs.map((p) => p.programId));

	return {
		...mapToGroupDto(row, members.length),
		channelId: channel.id,
		members: members.map((athlete) =>
			mapToGroupMemberDto(athlete, ruleProgramIds),
		),
	};
}
