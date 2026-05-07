import type { cookies } from "next/headers";
import {
	buildCookieHeader,
	clearTokens,
	getRcaConfig,
	getSession,
	parseSetCookieHeader,
	RCA_REQUEST_HEADERS,
	type RcaSessionData,
	saveTokens,
} from "@/app/api/v1/rca/utils";
import { createLogger } from "@/lib/logger";
import {
	type RcaMembershipItem,
	rcaMembershipsResponseSchema,
} from "@/schemas";

const logger = createLogger("rca.service");

type CookieStore = Awaited<ReturnType<typeof cookies>>;

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
	isConnected: () => Promise<boolean>;
	login: (credentials: {
		username: string;
		password: string;
	}) => Promise<RcaLoginResult>;
	fetchProgramMemberships: () => Promise<RcaMembershipItem[]>;
	fetchOrganizationMemberships: () => Promise<RcaMembershipItem[]>;
	fetchParticipantMemberships: () => Promise<RcaMembershipItem[]>;
	disconnect: () => Promise<void>;
};

export function createRcaService({
	cookieStore,
}: {
	cookieStore: CookieStore;
}): RcaService {
	async function isConnected(): Promise<boolean> {
		const session = await getSession({ cookieStore });
		return session !== null;
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

		await saveTokens({ sessionData: session, cookieStore });
		logger.info("login succeeded");
		return { ok: true, session };
	}

	async function fetchProgramMemberships(): Promise<RcaMembershipItem[]> {
		const config = getRcaConfig();
		const url = await urlWithPartyId(config.programMembershipsUrl);
		return parseMembershipsResponse(
			await postKendoRead(url),
			"programMemberships",
		);
	}

	async function fetchOrganizationMemberships(): Promise<RcaMembershipItem[]> {
		const config = getRcaConfig();
		const url = await urlWithPartyId(config.organizationMembershipsUrl);
		return parseMembershipsResponse(
			await postKendoRead(url),
			"organizationMemberships",
		);
	}

	async function fetchParticipantMemberships(): Promise<RcaMembershipItem[]> {
		const config = getRcaConfig();
		const partyId = await getPartyId();
		const params = new URLSearchParams({ partyRoleTypePerson: "participant" });
		if (partyId) params.set("partyId", String(partyId));
		const url = `${config.participantMembershipsUrl}?${params.toString()}`;
		return parseMembershipsResponse(
			await postKendoRead(url),
			"participantMemberships",
		);
	}

	async function urlWithPartyId(baseUrl: string): Promise<string> {
		const partyId = await getPartyId();
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

	async function postKendoRead(url: string): Promise<unknown> {
		const session = await getSession({ cookieStore });
		if (!session) {
			throw new RcaSessionExpiredError();
		}

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
			await clearTokens({ cookieStore });
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

	let cachedPartyId: number | null | undefined;
	async function getPartyId(): Promise<number | null> {
		if (cachedPartyId !== undefined) return cachedPartyId;
		const session = await getSession({ cookieStore });
		if (!session) {
			throw new RcaSessionExpiredError();
		}
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
			await clearTokens({ cookieStore });
			throw new RcaSessionExpiredError();
		}
		if (!response.ok) {
			logger.warn("dashboard fetch for partyId failed", {
				status: response.status,
			});
			cachedPartyId = null;
			return null;
		}
		const html = await response.text();
		const match =
			html.match(/partyId=(\d+)/) ??
			html.match(/party[_-]?id["']?\s*[:=]\s*["']?(\d+)/i);
		cachedPartyId = match ? Number(match[1]) : null;
		if (cachedPartyId == null) {
			logger.warn("could not find partyId in dashboard HTML");
		} else {
			logger.info("discovered partyId", { partyId: cachedPartyId });
		}
		return cachedPartyId;
	}

	async function disconnect(): Promise<void> {
		await clearTokens({ cookieStore });
		logger.info("disconnected — cleared cookies");
	}

	return {
		isConnected,
		login,
		fetchProgramMemberships,
		fetchOrganizationMemberships,
		fetchParticipantMemberships,
		disconnect,
	};
}

function extractVerificationToken(html: string): string | null {
	const match = html.match(
		/name="__RequestVerificationToken"[^>]*value="([^"]+)"/,
	);
	return match?.[1] ?? null;
}
