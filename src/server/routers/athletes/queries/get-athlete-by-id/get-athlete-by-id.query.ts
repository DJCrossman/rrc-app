import type { GetAthleteByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import { athleteInclude } from "@/server/routers/athletes/common/map-to-athlete-dto";
import { mapToAthleteWithGroups } from "@/server/routers/athletes/common/map-to-athlete-with-groups";
import { findGroupRules } from "@/server/routers/groups/common";

export async function getAthleteByIdQuery(
	input: GetAthleteByIdInput,
	{ db }: Context,
) {
	if (!input.id) return null;
	const row = await db.athlete.findUnique({
		where: { id: input.id },
		include: athleteInclude,
	});
	return row ? mapToAthleteWithGroups(row, await findGroupRules(db)) : null;
}
