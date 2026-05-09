import { TRPCError } from "@trpc/server";
import type { AuthenticatedContext } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function disconnectConcept2Command(
	_input: undefined,
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
		data: {
			concept2UserId: null,
			concept2AccessToken: null,
			concept2RefreshToken: null,
			concept2TokenExpiresAt: null,
			concept2ConnectedAt: null,
		},
	});

	return mapToUserDto(updated);
}
