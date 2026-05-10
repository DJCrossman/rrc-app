import { TRPCError } from "@trpc/server";
import { createLogger } from "@/lib/logger";
import type { ConnectRcaInput } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { encryptToken } from "@/server/integration-token-crypto";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

const logger = createLogger("rca.connect");

export async function connectRcaCommand(
	input: ConnectRcaInput,
	{ db, services, athlete }: AuthenticatedContext,
) {
	const result = await services.rca.login(input);
	if (!result.ok) {
		logger.warn("RCA login rejected", { reason: result.reason });
		throw new TRPCError({
			code:
				result.reason === "invalid_credentials"
					? "UNAUTHORIZED"
					: "BAD_GATEWAY",
			message: result.reason,
		});
	}

	const updated = await db.athlete.update({
		where: { id: athlete.id },
		data: {
			rcaUsername: encryptToken(input.username),
			rcaPassword: encryptToken(input.password),
			rcaConnectedAt: new Date(),
		},
	});
	logger.info("connection saved", { athleteId: athlete.id });

	return mapToUserDto(updated);
}
