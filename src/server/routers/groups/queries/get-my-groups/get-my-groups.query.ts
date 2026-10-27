import { paginate } from "@/lib/pagination";
import type { ViewerContext } from "@/server/context";
import { getAthleteGroups } from "../../common/group-members";

export async function getMyGroupsQuery(
	_input: undefined,
	{ db, athlete }: ViewerContext,
) {
	const data = athlete ? await getAthleteGroups(db, athlete.id) : [];
	return paginate({ data, totalCount: data.length });
}
