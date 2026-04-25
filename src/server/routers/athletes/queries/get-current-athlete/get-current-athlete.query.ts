import type { AuthenticatedContext } from "@/server/context";
import {
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function getCurrentAthleteQuery(
	_input: undefined,
	{ db, userId }: AuthenticatedContext,
) {
	const row = await db.athlete.findUnique({
		where: { userId },
		include: athleteInclude,
	});
	if (!row) {
		throw new Error(`Athlete not found for userId ${userId}`);
	}
	return mapToAthleteDto(row);
}
