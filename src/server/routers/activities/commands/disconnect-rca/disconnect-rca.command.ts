import type { AuthenticatedContext } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function disconnectRcaCommand(
	_input: undefined,
	{ db, athlete }: AuthenticatedContext,
) {
	const updated = await db.athlete.update({
		where: { id: athlete.id },
		data: {
			rcaUsername: null,
			rcaPassword: null,
			rcaConnectedAt: null,
		},
	});

	return mapToUserDto(updated);
}
