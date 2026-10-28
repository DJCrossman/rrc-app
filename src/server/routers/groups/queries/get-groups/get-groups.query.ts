import { paginate } from "@/lib/pagination";
import type { ViewerContext } from "@/server/context";
import { findRuleMemberships } from "../../common/group-members";
import { resolveGroupMemberIds } from "../../common/group-membership";
import { groupInclude, mapToGroupDto } from "../../common/map-to-group-dto";
import { canSeeGroup, getViewerGroups } from "../../common/viewer-groups";

export async function getGroupsQuery(_input: undefined, ctx: ViewerContext) {
	const { db } = ctx;
	const [allRows, viewer] = await Promise.all([
		db.group.findMany({
			include: groupInclude,
			orderBy: { name: "asc" },
		}),
		getViewerGroups(ctx),
	]);
	const rows = allRows.filter((row) => canSeeGroup(viewer, row.id));
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
