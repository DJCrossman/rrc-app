import type { Context } from "@/server/context";
import {
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function getAthletesQuery(_input: undefined, { db }: Context) {
	const rows = await db.athlete.findMany({
		orderBy: { id: "asc" },
		include: athleteInclude,
	});
	return { data: rows.map(mapToAthleteDto) };
}
