import type { ViewerContext } from "@/server/context";
import { mapToAthleteWithGroups } from "@/server/routers/athletes/common/map-to-athlete-with-groups";
import { findGroupRules } from "@/server/routers/groups/common";

export async function getCurrentAthleteQuery(
	_input: undefined,
	{ db, athlete }: ViewerContext,
) {
	return athlete
		? mapToAthleteWithGroups(athlete, await findGroupRules(db))
		: null;
}
