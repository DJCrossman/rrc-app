import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";

const REFRESH_BUFFER_MS = 60 * 60 * 1000;

const logger = createLogger("strava.access-token");

export async function getStravaAccessToken({
	db,
	athlete,
	services,
}: Pick<AuthenticatedContext, "db" | "athlete" | "services">): Promise<
	string | null
> {
	const expiry = athlete.stravaTokenExpiresAt?.getTime() ?? null;
	const tokenState = {
		hasAccessToken: !!athlete.stravaAccessToken,
		hasRefreshToken: !!athlete.stravaRefreshToken,
		expiry,
		msUntilExpiry: expiry ? expiry - Date.now() : null,
	};

	if (
		athlete.stravaAccessToken &&
		expiry &&
		Date.now() < expiry - REFRESH_BUFFER_MS
	) {
		logger.info("access token reused", tokenState);
		return services.strava.decryptToken(athlete.stravaAccessToken);
	}

	if (!athlete.stravaRefreshToken) {
		logger.warn("refresh token missing — cannot resolve access token", {
			...tokenState,
			reason: athlete.stravaAccessToken
				? "access token expired and no refresh token"
				: "no access token and no refresh token",
		});
		return null;
	}

	logger.info("attempting token refresh", tokenState);
	const refreshed = await services.strava.refreshTokens(
		services.strava.decryptToken(athlete.stravaRefreshToken),
	);
	if (!refreshed) return null;

	await db.athlete.update({
		where: { id: athlete.id },
		data: {
			stravaAccessToken: services.strava.encryptToken(refreshed.access_token),
			stravaRefreshToken: services.strava.encryptToken(refreshed.refresh_token),
			stravaTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
		},
	});
	return refreshed.access_token;
}
