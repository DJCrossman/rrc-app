import type { cookies } from "next/headers";

export interface Concept2TokenData {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

const CONCEPT2_TOKEN_COOKIE = "concept2_access_token";
const CONCEPT2_REFRESH_COOKIE = "concept2_refresh_token";
const CONCEPT2_EXPIRY_COOKIE = "concept2_token_expiry";

export async function saveTokens({
	tokenData,
	cookieStore,
}: {
	tokenData: Concept2TokenData;
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	const expiryTime = Date.now() + tokenData.expires_in * 1000;

	cookieStore.set(CONCEPT2_TOKEN_COOKIE, tokenData.access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: tokenData.expires_in,
		path: "/",
	});

	cookieStore.set(CONCEPT2_REFRESH_COOKIE, tokenData.refresh_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 90,
		path: "/",
	});

	cookieStore.set(CONCEPT2_EXPIRY_COOKIE, expiryTime.toString(), {
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
	return cookieStore.get(CONCEPT2_TOKEN_COOKIE)?.value || null;
}

export async function getRefreshToken({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<string | null> {
	return cookieStore.get(CONCEPT2_REFRESH_COOKIE)?.value || null;
}

export async function getTokenExpiry({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<number | null> {
	const expiry = cookieStore.get(CONCEPT2_EXPIRY_COOKIE)?.value;
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
	cookieStore.delete(CONCEPT2_TOKEN_COOKIE);
	cookieStore.delete(CONCEPT2_REFRESH_COOKIE);
	cookieStore.delete(CONCEPT2_EXPIRY_COOKIE);
}

export function getConcept2Config() {
	const clientId = process.env.CONCEPT2_CLIENT_ID;
	const clientSecret = process.env.CONCEPT2_CLIENT_SECRET;
	const baseUrl = process.env.CONCEPT2_BASE_URL || "https://log.concept2.com";
	const callbackUrl =
		process.env.CONCEPT2_CALLBACK_URL ||
		"http://localhost:3000/api/v1/concept2/callback";

	if (!clientId || !clientSecret) {
		throw new Error("Concept2 OAuth credentials not configured");
	}

	return {
		clientId,
		clientSecret,
		baseUrl,
		callbackUrl,
		authUrl: `${baseUrl}/oauth/authorize`,
		tokenUrl: `${baseUrl}/oauth/access_token`,
	};
}
