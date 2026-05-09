import { createLogger } from "@/lib/logger";
import type { Context } from "@/server/context";
import { decryptToken, encryptToken } from "@/server/integration-token-crypto";

const REFRESH_BUFFER_MS = 60 * 60 * 1000;

const logger = createLogger("concept2.access-token");

// Variant of getConcept2AccessToken that resolves an athlete by primary key
// rather than by Clerk userId — used by the Concept2 webhook handler, where
// the request has no authenticated user but identifies the athlete via the
// `user_id` field in the event (concept2UserId).
export async function getConcept2AccessTokenForAthlete({
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
			concept2AccessToken: true,
			concept2RefreshToken: true,
			concept2TokenExpiresAt: true,
		},
	});
	if (!row) return null;

	const expiry = row.concept2TokenExpiresAt?.getTime() ?? null;
	const tokenState = {
		athleteId,
		hasAccessToken: !!row.concept2AccessToken,
		hasRefreshToken: !!row.concept2RefreshToken,
		expiry,
		msUntilExpiry: expiry ? expiry - Date.now() : null,
	};

	if (
		row.concept2AccessToken &&
		expiry &&
		Date.now() < expiry - REFRESH_BUFFER_MS
	) {
		return decryptToken(row.concept2AccessToken);
	}

	if (!row.concept2RefreshToken) {
		logger.warn(
			"refresh token missing — cannot resolve access token",
			tokenState,
		);
		return null;
	}

	const refreshed = await services.concept2.refreshTokens(
		decryptToken(row.concept2RefreshToken),
	);
	if (!refreshed) return null;

	await db.athlete.update({
		where: { id: row.id },
		data: {
			concept2AccessToken: encryptToken(refreshed.access_token),
			concept2RefreshToken: encryptToken(refreshed.refresh_token),
			concept2TokenExpiresAt: new Date(
				Date.now() + refreshed.expires_in * 1000,
			),
		},
	});
	return refreshed.access_token;
}
