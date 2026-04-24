import type { GetAthleteByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import {
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function getAthleteByIdQuery(
	input: GetAthleteByIdInput,
	{ db }: Context,
) {
	if (!input.id) return null;
	const row = await db.athlete.findUnique({
		where: { id: input.id },
		include: athleteInclude,
	});
	return row ? mapToAthleteDto(row) : null;
}
