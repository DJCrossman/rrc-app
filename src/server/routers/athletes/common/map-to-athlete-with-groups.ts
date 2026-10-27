import {
	type GroupRule,
	resolveAthleteGroups,
} from "@/server/routers/groups/common/group-membership";
import { type AthleteRow, mapToAthleteDto } from "./map-to-athlete-dto";

export function mapToAthleteWithGroups(row: AthleteRow, rules: GroupRule[]) {
	return {
		...mapToAthleteDto(row),
		groups: resolveAthleteGroups({ memberships: row.memberships, rules }),
	};
}
