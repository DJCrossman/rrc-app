import type { GetGroupByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import { getGroupMembers } from "../../common/group-members";
import {
	groupInclude,
	mapToGroupDto,
	mapToGroupMemberDto,
} from "../../common/map-to-group-dto";

export async function getGroupByIdQuery(
	input: GetGroupByIdInput,
	{ db }: Context,
) {
	const row = await db.group.findUnique({
		where: { id: input.id },
		include: groupInclude,
	});
	if (!row) return null;

	const members = await getGroupMembers(db, row.id);
	const ruleProgramIds = new Set(row.programs.map((p) => p.programId));

	return {
		...mapToGroupDto(row, members.length),
		members: members.map((athlete) =>
			mapToGroupMemberDto(athlete, ruleProgramIds),
		),
	};
}
