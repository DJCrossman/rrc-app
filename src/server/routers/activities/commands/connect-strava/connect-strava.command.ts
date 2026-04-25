import { TRPCError } from "@trpc/server";
import type { ConnectStravaInput } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function connectStravaCommand(
	input: ConnectStravaInput,
	{ db, userId }: AuthenticatedContext,
) {
	const athlete = await db.athlete.findUnique({ where: { userId } });
	if (!athlete) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Athlete profile not found",
		});
	}

	const updated = await db.athlete.update({
		where: { id: athlete.id },
		data: { stravaAthleteId: input.stravaAthleteId },
	});

	return mapToUserDto(updated);
}
