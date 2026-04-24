import type { UpdateAthlete } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function updateUserProfileCommand(
	input: UpdateAthlete,
	{ db }: Context,
) {
	const updated = await db.athlete.update({
		where: { id: input.id },
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			nickname: input.nickname,
			phone: input.phone,
			email: input.email,
			gender: input.gender,
			dateOfBirth: new Date(input.dateOfBirth),
			dateJoined: input.dateJoined ? new Date(input.dateJoined) : undefined,
			heightInCm: input.heightInCm,
			weightInKg: input.weightInKg,
		},
	});
	return mapToUserDto(updated);
}
