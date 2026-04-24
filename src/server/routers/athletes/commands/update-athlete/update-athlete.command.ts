import type { UpdateAthlete } from "@/schemas/athlete.schema";
import type { Context } from "@/server/context";
import {
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function updateAthleteCommand(
	input: UpdateAthlete,
	{ db }: Context,
) {
	const row = await db.athlete.update({
		where: { id: input.id },
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			nickname: input.nickname,
			phone: input.phone,
			gender: input.gender,
			dateOfBirth: new Date(input.dateOfBirth),
			dateJoined: input.dateJoined ? new Date(input.dateJoined) : undefined,
			heightInCm: input.heightInCm,
			weightInKg: input.weightInKg,
		},
		include: athleteInclude,
	});
	return mapToAthleteDto(row);
}
