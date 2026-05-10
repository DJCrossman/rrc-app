import { createLogger } from "@/lib/logger";
import type { ConnectStravaInput } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

const logger = createLogger("strava.connect");

export async function connectStravaCommand(
	input: ConnectStravaInput,
	{ db, services, athlete }: AuthenticatedContext,
) {
	const { tokens, athlete: stravaAthlete } = input;
	const updated = await db.athlete.update({
		where: { id: athlete.id },
		data: {
			stravaAthleteId: stravaAthlete.id.toString(),
			stravaAccessToken: services.strava.encryptToken(tokens.access_token),
			stravaRefreshToken: services.strava.encryptToken(tokens.refresh_token),
			stravaTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
			stravaAthleteJson: stravaAthlete,
			stravaConnectedAt: new Date(),
		},
	});
	logger.info("connection saved", { athleteId: athlete.id });

	return mapToUserDto(updated);
}
