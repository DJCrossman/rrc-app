import { paginate } from "@/lib/pagination";
import type { Context } from "@/server/context";
import { findRuleMemberships } from "../../common/group-members";
import { resolveGroupMemberIds } from "../../common/group-membership";
import { groupInclude, mapToGroupDto } from "../../common/map-to-group-dto";

export async function getGroupsQuery(_input: undefined, { db }: Context) {
	const rows = await db.group.findMany({
		include: groupInclude,
		orderBy: { name: "asc" },
	});
	const memberships = await findRuleMemberships(db, [
		...new Set(rows.flatMap((row) => row.programs.map((p) => p.programId))),
	]);

	const data = rows.map((row) =>
		mapToGroupDto(
			row,
			resolveGroupMemberIds({
				programIds: row.programs.map((p) => p.programId),
				memberships,
			}).length,
		),
	);
	return paginate({ data, totalCount: data.length });
}
