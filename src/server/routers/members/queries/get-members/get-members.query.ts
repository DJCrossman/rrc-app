import { paginate } from "@/lib/pagination";
import type { GetMembersInput } from "@/schemas";
import {
	listOrganizationMembers,
	listPendingInvitations,
} from "@/server/clerk/organization-members";
import type { Context } from "@/server/context";
import { athleteInclude } from "@/server/routers/athletes/common/map-to-athlete-dto";
import { mapToAthleteWithGroups } from "@/server/routers/athletes/common/map-to-athlete-with-groups";
import { findGroupRules } from "@/server/routers/groups/common";
import {
	filterMembers,
	mergeMembers,
	sortMembers,
} from "../../common/member-rows";

export async function getMembersQuery(input: GetMembersInput, { db }: Context) {
	const {
		page,
		pageSize = 20,
		sortBy,
		order,
		programIds,
		isActive,
		search,
	} = input;
	const [users, invitations, athletes, rules] = await Promise.all([
		listOrganizationMembers(),
		listPendingInvitations(),
		db.athlete.findMany({ include: athleteInclude }),
		findGroupRules(db),
	]);

	const rows = sortMembers(
		filterMembers(
			mergeMembers({
				users,
				invitations,
				athletes: athletes.map((row) => mapToAthleteWithGroups(row, rules)),
			}),
			{ search, programIds, isActive },
		),
		{ sortBy, order },
	);
	const start = ((page ?? 1) - 1) * pageSize;

	return paginate({
		data: rows.slice(start, start + pageSize),
		totalCount: rows.length,
		page,
		pageSize,
	});
}
