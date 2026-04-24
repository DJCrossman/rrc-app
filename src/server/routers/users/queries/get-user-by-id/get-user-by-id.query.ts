import type { GetUserByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function getUserByIdQuery(
	input: GetUserByIdInput,
	{ db }: Context,
) {
	const user = await db.athlete.findUnique({ where: { id: input.id } });
	if (!user) {
		throw new Error("User not found");
	}
	return mapToUserDto(user);
}
