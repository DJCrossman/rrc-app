import { createLogger } from "@/lib/logger";
import type { Context } from "@/server/context";

const REFRESH_BUFFER_MS = 60 * 60 * 1000;

const logger = createLogger("strava.access-token");

// Variant of getStravaAccessToken that resolves an athlete by primary key
// rather than by Clerk userId — used by the Strava webhook handler, where
// the request has no authenticated user but identifies the athlete via
// `owner_id` (stravaAthleteId).
export async function getStravaAccessTokenForAthlete({
	db,
	services,
	athleteId,
}: Pick<Context, "db" | "services"> & { athleteId: string }): Promise<
	string | null
> {
	const row = await db.athlete.findUnique({
		where: { id: athleteId },
		select: {
			id: true,
			stravaAccessToken: true,
			stravaRefreshToken: true,
			stravaTokenExpiresAt: true,
		},
	});
	if (!row) return null;

	const expiry = row.stravaTokenExpiresAt?.getTime() ?? null;
	const tokenState = {
		athleteId,
		hasAccessToken: !!row.stravaAccessToken,
		hasRefreshToken: !!row.stravaRefreshToken,
		expiry,
		msUntilExpiry: expiry ? expiry - Date.now() : null,
	};

	if (
		row.stravaAccessToken &&
		expiry &&
		Date.now() < expiry - REFRESH_BUFFER_MS
	) {
		return services.strava.decryptToken(row.stravaAccessToken);
	}

	if (!row.stravaRefreshToken) {
		logger.warn(
			"refresh token missing — cannot resolve access token",
			tokenState,
		);
		return null;
	}

	const refreshed = await services.strava.refreshTokens(
		services.strava.decryptToken(row.stravaRefreshToken),
	);
	if (!refreshed) return null;

	await db.athlete.update({
		where: { id: row.id },
		data: {
			stravaAccessToken: services.strava.encryptToken(refreshed.access_token),
			stravaRefreshToken: services.strava.encryptToken(refreshed.refresh_token),
			stravaTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
		},
	});
	return refreshed.access_token;
}
