import type { AuthenticatedContext } from "@/server/context";
import { mapToAthleteDto } from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function getCurrentAthleteQuery(
	_input: undefined,
	{ athlete }: AuthenticatedContext,
) {
	return mapToAthleteDto(athlete);
}
