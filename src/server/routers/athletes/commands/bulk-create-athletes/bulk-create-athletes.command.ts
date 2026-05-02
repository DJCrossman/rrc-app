import type { BulkCreateAthletes } from "@/schemas/athlete.schema";
import type { Context } from "@/server/context";
import {
	type AthleteRow,
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function bulkCreateAthletesCommand(
	input: BulkCreateAthletes,
	{ db }: Context,
) {
	const rows = await db.$transaction(async (tx) => {
		const created: AthleteRow[] = [];
		for (const athlete of input.athletes) {
			const row = await tx.athlete.create({
				data: {
					firstName: athlete.firstName,
					lastName: athlete.lastName,
					nickname: athlete.nickname,
					phone: athlete.phone,
					gender: athlete.gender,
					dateOfBirth: new Date(athlete.dateOfBirth),
					dateJoined: athlete.dateJoined
						? new Date(athlete.dateJoined)
						: undefined,
					heightInCm: athlete.heightInCm,
					weightInKg: athlete.weightInKg,
				},
				include: athleteInclude,
			});
			created.push(row);
		}
		return created;
	});
	return rows.map(mapToAthleteDto);
}
