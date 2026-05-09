import { createLogger } from "@/lib/logger";
import {
	type RcaMembershipItem,
	rcaMembershipsResponseSchema,
} from "@/schemas";

const logger = createLogger("rca.service");

export interface RcaSessionData {
	authCookie: string;
	csrfCookie: string;
}

export class RcaSessionExpiredError extends Error {
	constructor() {
		super("RCA session expired or invalid");
		this.name = "RcaSessionExpiredError";
	}
}

export type RcaLoginResult =
	| { ok: true; session: RcaSessionData }
	| {
			ok: false;
			reason:
				| "invalid_credentials"
				| "verification_token_missing"
				| "network_error";
	  };

export type RcaService = {
	login: (credentials: {
		username: string;
		password: string;
	}) => Promise<RcaLoginResult>;
	fetchProgramMemberships: (
		session: RcaSessionData,
	) => Promise<RcaMembershipItem[]>;
	fetchOrganizationMemberships: (
		session: RcaSessionData,
	) => Promise<RcaMembershipItem[]>;
	fetchParticipantMemberships: (
		session: RcaSessionData,
	) => Promise<RcaMembershipItem[]>;
};

export function createRcaService(): RcaService {
	return {
		login,
		fetchProgramMemberships,
		fetchOrganizationMemberships,
		fetchParticipantMemberships,
	};
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

const RCA_REQUEST_HEADERS = {
	"User-Agent": USER_AGENT,
	"Accept-Language": "en-US,en;q=0.9",
};

function parseSetCookieHeader(
	setCookie: string | null,
	name: string,
): string | null {
	if (!setCookie) return null;
	const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
	return match?.[1] ?? null;
}

function buildCookieHeader(session: RcaSessionData): string {
	const parts = [`RCA_WRSAUTH=${session.authCookie}`];
	if (session.csrfCookie) {
		parts.push(`__RequestVerificationToken=${session.csrfCookie}`);
	}
	return parts.join("; ");
}

function extractVerificationToken(html: string): string | null {
	const match = html.match(
		/name="__RequestVerificationToken"[^>]*value="([^"]+)"/,
	);
	return match?.[1] ?? null;
}

async function login({
	username,
	password,
}: {
	username: string;
	password: string;
}): Promise<RcaLoginResult> {
	const config = getRcaConfig();
	logger.info("login start", { username });

	const formResponse = await fetch(config.loginUrl, {
		method: "GET",
		headers: RCA_REQUEST_HEADERS,
		redirect: "manual",
	}).catch((err) => {
		logger.error("login GET failed", { error: String(err) });
		return null;
	});

	if (!formResponse || !formResponse.ok) {
		return { ok: false, reason: "network_error" };
	}

	const html = await formResponse.text();
	const formToken = extractVerificationToken(html);
	const csrfCookie = parseSetCookieHeader(
		formResponse.headers.get("set-cookie"),
		"__RequestVerificationToken",
	);

	if (!formToken || !csrfCookie) {
		logger.error("verification token missing", {
			hasFormToken: !!formToken,
			hasCsrfCookie: !!csrfCookie,
		});
		return { ok: false, reason: "verification_token_missing" };
	}

	const body = new URLSearchParams({
		UserName: username,
		Password: password,
		__RequestVerificationToken: formToken,
		RememberMe: "true",
	});

	const loginResponse = await fetch(config.loginUrl, {
		method: "POST",
		headers: {
			...RCA_REQUEST_HEADERS,
			"Content-Type": "application/x-www-form-urlencoded",
			Cookie: `__RequestVerificationToken=${csrfCookie}`,
			Origin: config.baseUrl,
			Referer: config.loginUrl,
		},
		body,
		redirect: "manual",
	}).catch((err) => {
		logger.error("login POST failed", { error: String(err) });
		return null;
	});

	if (!loginResponse) {
		return { ok: false, reason: "network_error" };
	}

	const setCookieHeader = loginResponse.headers.get("set-cookie");
	const authCookie = parseSetCookieHeader(setCookieHeader, "RCA_WRSAUTH");

	if (!authCookie) {
		logger.warn("login rejected — no RCA_WRSAUTH cookie", {
			status: loginResponse.status,
		});
		return { ok: false, reason: "invalid_credentials" };
	}

	const refreshedCsrf =
		parseSetCookieHeader(setCookieHeader, "__RequestVerificationToken") ??
		csrfCookie;

	const session: RcaSessionData = {
		authCookie,
		csrfCookie: refreshedCsrf,
	};

	logger.info("login succeeded");
	return { ok: true, session };
}

async function fetchProgramMemberships(
	session: RcaSessionData,
): Promise<RcaMembershipItem[]> {
	const config = getRcaConfig();
	const url = await urlWithPartyId(session, config.programMembershipsUrl);
	return parseMembershipsResponse(
		await postKendoRead(session, url),
		"programMemberships",
	);
}

async function fetchOrganizationMemberships(
	session: RcaSessionData,
): Promise<RcaMembershipItem[]> {
	const config = getRcaConfig();
	const url = await urlWithPartyId(session, config.organizationMembershipsUrl);
	return parseMembershipsResponse(
		await postKendoRead(session, url),
		"organizationMemberships",
	);
}

async function fetchParticipantMemberships(
	session: RcaSessionData,
): Promise<RcaMembershipItem[]> {
	const config = getRcaConfig();
	const partyId = await getPartyId(session);
	const params = new URLSearchParams({ partyRoleTypePerson: "participant" });
	if (partyId) params.set("partyId", String(partyId));
	const url = `${config.participantMembershipsUrl}?${params.toString()}`;
	return parseMembershipsResponse(
		await postKendoRead(session, url),
		"participantMemberships",
	);
}

async function urlWithPartyId(
	session: RcaSessionData,
	baseUrl: string,
): Promise<string> {
	const partyId = await getPartyId(session);
	return partyId ? `${baseUrl}?partyId=${partyId}` : baseUrl;
}

function parseMembershipsResponse(
	json: unknown,
	label: string,
): RcaMembershipItem[] {
	const parsed = rcaMembershipsResponseSchema.safeParse(json);
	if (!parsed.success) {
		logger.error(`${label} response did not match schema`, {
			issue: parsed.error.message,
		});
		throw new Error(`RCA ${label} response invalid: ${parsed.error.message}`);
	}
	const items = parsed.data.Data ?? [];
	logger.info(`${label} fetched`, {
		count: items.length,
		sampleKeys: items[0] ? Object.keys(items[0]) : [],
		sampleItem: items[0] ?? null,
	});
	return items;
}

async function postKendoRead(
	session: RcaSessionData,
	url: string,
): Promise<unknown> {
	const config = getRcaConfig();
	const response = await fetch(url, {
		method: "POST",
		headers: {
			...RCA_REQUEST_HEADERS,
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Cookie: buildCookieHeader(session),
			Origin: config.baseUrl,
			Referer: config.dashboardUrl,
			"X-Requested-With": "XMLHttpRequest",
		},
		body: "sort=&page=1&pageSize=200&group=&filter=",
		redirect: "manual",
	});

	if (response.status === 302 || response.status === 401) {
		logger.warn("RCA request returned auth redirect", {
			status: response.status,
			url,
		});
		throw new RcaSessionExpiredError();
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => "<unreadable>");
		logger.error("RCA fetch failed", {
			status: response.status,
			url,
			body: errorText.slice(0, 500),
		});
		throw new Error(`RCA fetch failed (${response.status}) for ${url}`);
	}

	const text = await response.text();
	if (!text.trim()) {
		logger.warn("RCA response body was empty", { url });
		return { Data: [], Total: 0 };
	}
	try {
		return JSON.parse(text);
	} catch (err) {
		logger.error("RCA response was not JSON", {
			url,
			body: text.slice(0, 500),
			error: String(err),
		});
		throw new Error(`RCA response invalid JSON for ${url}`);
	}
}

const partyIdCache = new WeakMap<RcaSessionData, number | null>();

async function getPartyId(session: RcaSessionData): Promise<number | null> {
	const cached = partyIdCache.get(session);
	if (cached !== undefined) return cached;
	const config = getRcaConfig();
	const response = await fetch(config.dashboardUrl, {
		method: "GET",
		headers: {
			...RCA_REQUEST_HEADERS,
			Accept: "text/html",
			Cookie: buildCookieHeader(session),
		},
		redirect: "manual",
	});
	if (response.status === 302) {
		throw new RcaSessionExpiredError();
	}
	if (!response.ok) {
		logger.warn("dashboard fetch for partyId failed", {
			status: response.status,
		});
		partyIdCache.set(session, null);
		return null;
	}
	const html = await response.text();
	const match =
		html.match(/partyId=(\d+)/) ??
		html.match(/party[_-]?id["']?\s*[:=]\s*["']?(\d+)/i);
	const partyId = match ? Number(match[1]) : null;
	if (partyId == null) {
		logger.warn("could not find partyId in dashboard HTML");
	} else {
		logger.info("discovered partyId", { partyId });
	}
	partyIdCache.set(session, partyId);
	return partyId;
}
