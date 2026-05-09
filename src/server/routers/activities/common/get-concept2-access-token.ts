import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";
import { decryptToken, encryptToken } from "@/server/integration-token-crypto";

const REFRESH_BUFFER_MS = 60 * 60 * 1000;

const logger = createLogger("concept2.access-token");

export async function getConcept2AccessToken({
	db,
	userId,
	services,
}: Pick<AuthenticatedContext, "db" | "userId" | "services">): Promise<
	string | null
> {
	const row = await db.athlete.findUnique({
		where: { userId },
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
		logger.info("access token reused", tokenState);
		return decryptToken(row.concept2AccessToken);
	}

	if (!row.concept2RefreshToken) {
		logger.warn("refresh token missing — cannot resolve access token", {
			...tokenState,
			reason: row.concept2AccessToken
				? "access token expired and no refresh token"
				: "no access token and no refresh token",
		});
		return null;
	}

	logger.info("attempting token refresh", tokenState);
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
