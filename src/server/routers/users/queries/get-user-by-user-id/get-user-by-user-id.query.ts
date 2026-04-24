import type { GetUserByUserIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function getUserByUserIdQuery(
	input: GetUserByUserIdInput,
	{ db }: Context,
) {
	const user = await db.athlete.findUnique({
		where: { userId: input.userId },
	});
	return user ? mapToUserDto(user) : null;
}
