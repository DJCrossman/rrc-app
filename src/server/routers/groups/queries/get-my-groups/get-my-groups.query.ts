import { paginate } from "@/lib/pagination";
import type { AuthenticatedContext } from "@/server/context";
import { getAthleteGroups } from "../../common/group-members";

export async function getMyGroupsQuery(
	_input: undefined,
	{ db, athlete }: AuthenticatedContext,
) {
	const data = await getAthleteGroups(db, athlete.id);
	return paginate({ data, totalCount: data.length });
}
