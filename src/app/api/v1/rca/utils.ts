import type { cookies } from "next/headers";

export interface RcaSessionData {
	authCookie: string;
	csrfCookie: string;
}

const RCA_AUTH_COOKIE = "rca_session";
const RCA_CSRF_COOKIE = "rca_csrf";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export async function saveTokens({
	sessionData,
	cookieStore,
}: {
	sessionData: RcaSessionData;
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	cookieStore.set(RCA_AUTH_COOKIE, sessionData.authCookie, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: COOKIE_MAX_AGE_SECONDS,
		path: "/",
	});

	cookieStore.set(RCA_CSRF_COOKIE, sessionData.csrfCookie, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: COOKIE_MAX_AGE_SECONDS,
		path: "/",
	});
}

export async function getSession({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}): Promise<RcaSessionData | null> {
	const authCookie = cookieStore.get(RCA_AUTH_COOKIE)?.value;
	const csrfCookie = cookieStore.get(RCA_CSRF_COOKIE)?.value;
	if (!authCookie) return null;
	return { authCookie, csrfCookie: csrfCookie ?? "" };
}

export async function clearTokens({
	cookieStore,
}: {
	cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
	cookieStore.delete(RCA_AUTH_COOKIE);
	cookieStore.delete(RCA_CSRF_COOKIE);
}

export function getRcaConfig() {
	const baseUrl =
		process.env.RCA_BASE_URL || "https://membership.rowingcanada.org";

	return {
		baseUrl,
		loginUrl: `${baseUrl}/Account/Login`,
		dashboardUrl: `${baseUrl}/PersonDashboard`,
		programMembershipsUrl: `${baseUrl}/PersonDashboard/OrgMemberships_Read`,
		organizationMembershipsUrl: `${baseUrl}/PersonDashboard/NonClubMemberships_Read`,
		participantMembershipsUrl: `${baseUrl}/PersonDashboard/MembershipsByPartyRoleType_Read`,
	};
}

const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

export const RCA_REQUEST_HEADERS = {
	"User-Agent": USER_AGENT,
	"Accept-Language": "en-US,en;q=0.9",
};

export function parseSetCookieHeader(
	setCookie: string | null,
	name: string,
): string | null {
	if (!setCookie) return null;
	const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
	return match?.[1] ?? null;
}

export function buildCookieHeader(session: RcaSessionData): string {
	const parts = [`RCA_WRSAUTH=${session.authCookie}`];
	if (session.csrfCookie) {
		parts.push(`__RequestVerificationToken=${session.csrfCookie}`);
	}
	return parts.join("; ");
}
