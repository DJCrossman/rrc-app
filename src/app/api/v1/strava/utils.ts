import { jwtVerify, SignJWT } from "jose";
import type { cookies } from "next/headers";
import type { StravaUser } from "@/schemas";
import type { StravaTokenData } from "./types";

const STRAVA_TOKEN_COOKIE = "strava_access_token";
const STRAVA_REFRESH_COOKIE = "strava_refresh_token";
const STRAVA_EXPIRY_COOKIE = "strava_token_expiry";
const STRAVA_ATHLETE_COOKIE = "strava_athlete";

export async function saveTokens({
	tokenData,
	cookieStore,
}: {
	tokenData: StravaTokenData;
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	const expiryTime = Date.now() + tokenData.expires_in * 1000;

	cookieStore.set(STRAVA_TOKEN_COOKIE, tokenData.access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: tokenData.expires_in,
		path: "/",
	});

	cookieStore.set(STRAVA_REFRESH_COOKIE, tokenData.refresh_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 90, // 90 days
		path: "/",
	});

	cookieStore.set(STRAVA_EXPIRY_COOKIE, expiryTime.toString(), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 90,
		path: "/",
	});
}

export async function getAccessToken({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<string | null> {
	return cookieStore.get(STRAVA_TOKEN_COOKIE)?.value || null;
}

export async function getRefreshToken({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<string | null> {
	return cookieStore.get(STRAVA_REFRESH_COOKIE)?.value || null;
}

export async function getTokenExpiry({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<number | null> {
	const expiry = cookieStore.get(STRAVA_EXPIRY_COOKIE)?.value;
	return expiry ? Number.parseInt(expiry, 10) : null;
}

export async function isTokenExpired({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<boolean> {
	const expiry = await getTokenExpiry({ cookieStore });
	if (!expiry) return true;
	return Date.now() >= expiry;
}

export async function clearTokens({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	cookieStore.delete(STRAVA_TOKEN_COOKIE);
	cookieStore.delete(STRAVA_REFRESH_COOKIE);
	cookieStore.delete(STRAVA_EXPIRY_COOKIE);
}

// JWT-based athlete cookie functions
export async function saveAthlete({
	athlete,
	cookieStore,
}: {
	athlete: StravaUser;
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	const config = getStravaConfig();
	const secret = new TextEncoder().encode(config.jwtSecret);

	const jwt = await new SignJWT({ athlete })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("90d")
		.sign(secret);

	cookieStore.set(STRAVA_ATHLETE_COOKIE, jwt, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 90, // 90 days
		path: "/",
	});
}

export async function getAthlete({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<StravaUser | null> {
	const jwt = cookieStore.get(STRAVA_ATHLETE_COOKIE)?.value;
	if (!jwt) return null;

	try {
		const config = getStravaConfig();
		const secret = new TextEncoder().encode(config.jwtSecret);

		const { payload } = await jwtVerify(jwt, secret);
		return payload.athlete as StravaUser;
	} catch (error) {
		console.error("Failed to verify athlete JWT:", error);
		return null;
	}
}

export async function clearAthlete({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	cookieStore.delete(STRAVA_ATHLETE_COOKIE);
}

export async function ensureValidToken({
	cookieStore,
	refreshUrl,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
	refreshUrl: string;
}): Promise<string | null> {
	const expiry = await getTokenExpiry({ cookieStore });
	const accessToken = await getAccessToken({ cookieStore });

	// If no token or expiring within 1 hour (3600 seconds), refresh it
	if (!accessToken || !expiry || Date.now() >= expiry - 3600 * 1000) {
		const refreshToken = await getRefreshToken({ cookieStore });
		if (!refreshToken) {
			return null;
		}

		// Call the refresh endpoint
		const refreshResponse = await fetch(refreshUrl, {
			method: "POST",
		});

		if (!refreshResponse.ok) {
			return null;
		}

		// Get the new access token
		return await getAccessToken({ cookieStore });
	}

	return accessToken;
}

export function getStravaConfig() {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const clientSecret = process.env.STRAVA_CLIENT_SECRET;
	const jwtSecret = process.env.STRAVA_JWT_SECRET;
	const callbackUrl =
		process.env.STRAVA_CALLBACK_URL ||
		"http://localhost:3000/api/v1/strava/callback";

	if (!clientId || !clientSecret) {
		throw new Error("Strava OAuth credentials not configured");
	}

	if (!jwtSecret) {
		throw new Error("Strava JWT secret not configured");
	}

	return {
		clientId,
		clientSecret,
		jwtSecret,
		callbackUrl,
		authUrl: "https://www.strava.com/oauth/authorize",
		tokenUrl: "https://www.strava.com/api/v3/oauth/token",
		baseApiUrl: "https://www.strava.com/api/v3",
	};
}
