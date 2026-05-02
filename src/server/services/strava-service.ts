import { DateTime } from "luxon";
import type { cookies } from "next/headers";
import type { StravaTokenData } from "@/app/api/v1/strava/types";
import {
	clearAthlete,
	clearTokens,
	getAccessToken,
	getRefreshToken,
	getStravaConfig,
	getTokenExpiry,
	getAthlete as readAthleteCookie,
	saveAthlete,
	saveTokens,
} from "@/app/api/v1/strava/utils";
import { createLogger } from "@/lib/logger";
import {
	type StravaActivity,
	type StravaUser,
	stravaActivitySchema,
	stravaUserSchema,
} from "@/schemas";

const REFRESH_BUFFER_MS = 60 * 60 * 1000;

const ROWING_SPORT_TYPES = new Set(["Rowing", "VirtualRow"]);

const logger = createLogger("strava.service");

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type StravaService = {
	resolveAccessToken: () => Promise<string | null>;
	fetchAllRowingActivities: () => Promise<StravaActivity[]>;
	fetchRecentRowingActivities: () => Promise<StravaActivity[]>;
	fetchAthlete: () => Promise<StravaUser>;
	disconnect: () => Promise<void>;
};

export class StravaServiceError extends Error {
	status: number;
	authRequired: boolean;
	constructor({
		message,
		status = 500,
		authRequired = false,
	}: {
		message: string;
		status?: number;
		authRequired?: boolean;
	}) {
		super(message);
		this.name = "StravaServiceError";
		this.status = status;
		this.authRequired = authRequired;
	}
}

export function createStravaService({
	cookieStore,
}: {
	cookieStore: CookieStore;
}): StravaService {
	async function resolveAccessToken(): Promise<string | null> {
		const expiry = await getTokenExpiry({ cookieStore });
		const accessToken = await getAccessToken({ cookieStore });
		const refreshToken = await getRefreshToken({ cookieStore });

		const cookieState = {
			hasAccessToken: !!accessToken,
			hasRefreshToken: !!refreshToken,
			expiry,
			msUntilExpiry: expiry ? expiry - Date.now() : null,
		};

		if (accessToken && expiry && Date.now() < expiry - REFRESH_BUFFER_MS) {
			logger.info("access token reused", cookieState);
			return accessToken;
		}

		if (!refreshToken) {
			logger.warn("refresh token missing — cannot resolve access token", {
				...cookieState,
				reason: accessToken
					? "access token expired and no refresh token"
					: "no access token and no refresh token",
			});
			return null;
		}

		logger.info("attempting token refresh", cookieState);
		const config = getStravaConfig();
		const response = await fetch(config.tokenUrl, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken,
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "<unreadable>");
			logger.error("token refresh failed", {
				status: response.status,
				body: errorText,
			});
			return null;
		}
		const tokenData = (await response.json()) as StravaTokenData;
		await saveTokens({ tokenData, cookieStore });
		logger.info("token refresh succeeded", {
			expiresIn: tokenData.expires_in,
		});
		return tokenData.access_token;
	}

	async function requireAccessToken(): Promise<string> {
		const accessToken = await resolveAccessToken();
		if (!accessToken) {
			logger.error("requireAccessToken aborted — no access token");
			throw new StravaServiceError({
				message: "Strava authentication required",
				status: 401,
				authRequired: true,
			});
		}
		return accessToken;
	}

	async function fetchActivitiesPage({
		accessToken,
		page,
		perPage,
		afterTimestamp,
	}: {
		accessToken: string;
		page: number;
		perPage: number;
		afterTimestamp?: number;
	}): Promise<unknown[]> {
		const config = getStravaConfig();
		const url = new URL(`${config.baseApiUrl}/athlete/activities`);
		url.searchParams.set("page", String(page));
		url.searchParams.set("per_page", String(perPage));
		if (afterTimestamp !== undefined) {
			url.searchParams.set("after", String(afterTimestamp));
		}

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("activities fetch failed", {
				page,
				status: response.status,
				body: errorText.slice(0, 500),
			});
			throw new StravaServiceError({
				message: `Strava activities fetch failed (${response.status}): ${errorText}`,
				status: response.status,
				authRequired: response.status === 401,
			});
		}

		const data = (await response.json()) as unknown;
		return Array.isArray(data) ? data : [];
	}

	function parseRowingActivities(raws: unknown[]): {
		rowing: StravaActivity[];
		nonRowing: number;
		invalidShape: number;
	} {
		const rowing: StravaActivity[] = [];
		let nonRowing = 0;
		let invalidShape = 0;
		let sampleInvalidLogged = false;
		for (const raw of raws) {
			if (!isStravaRowing(raw)) {
				nonRowing += 1;
				continue;
			}
			const parsed = stravaActivitySchema.safeParse(raw);
			if (parsed.success) {
				rowing.push(parsed.data);
				continue;
			}
			invalidShape += 1;
			if (!sampleInvalidLogged) {
				const record = raw as Record<string, unknown> | null;
				logger.warn("rowing activity failed schema parse", {
					stravaId: record?.id ?? null,
					issues: parsed.error.issues.slice(0, 10),
					sampleKeys:
						record && typeof record === "object" ? Object.keys(record) : [],
				});
				sampleInvalidLogged = true;
			}
		}
		return { rowing, nonRowing, invalidShape };
	}

	async function fetchAllRowingActivities(): Promise<StravaActivity[]> {
		logger.info("fetchAllRowingActivities start");
		const accessToken = await requireAccessToken();

		const all: unknown[] = [];
		const perPage = 200;
		let page = 1;

		while (true) {
			const data = await fetchActivitiesPage({ accessToken, page, perPage });
			if (data.length === 0) break;
			for (const raw of data) all.push(raw);
			if (data.length < perPage) break;
			page++;
		}

		const { rowing, nonRowing, invalidShape } = parseRowingActivities(all);
		logger.info("fetchAllRowingActivities complete", {
			pagesFetched: page,
			totalActivities: all.length,
			rowing: rowing.length,
			nonRowing,
			invalidShape,
		});
		return rowing;
	}

	async function fetchRecentRowingActivities(): Promise<StravaActivity[]> {
		const accessToken = await requireAccessToken();
		const afterTimestamp = Math.floor(
			DateTime.now().minus({ months: 4 }).startOf("month").toSeconds(),
		);

		const all: unknown[] = [];
		const perPage = 200;
		let page = 1;

		while (true) {
			const data = await fetchActivitiesPage({
				accessToken,
				page,
				perPage,
				afterTimestamp,
			});
			if (data.length === 0) break;
			for (const raw of data) all.push(raw);
			if (data.length < perPage) break;
			page++;
		}

		const { rowing } = parseRowingActivities(all);
		return rowing;
	}

	async function fetchAthlete(): Promise<StravaUser> {
		const cached = await readAthleteCookie({ cookieStore });
		if (cached) return cached;

		const accessToken = await requireAccessToken();
		const config = getStravaConfig();
		const response = await fetch(`${config.baseApiUrl}/athlete`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new StravaServiceError({
				message: "Failed to fetch athlete from Strava",
				status: response.status,
				authRequired: response.status === 401,
			});
		}

		const parsed = stravaUserSchema.safeParse(await response.json());
		if (!parsed.success) {
			throw new StravaServiceError({
				message: "Failed to parse athlete data from Strava",
			});
		}

		await saveAthlete({ athlete: parsed.data, cookieStore });
		return parsed.data;
	}

	async function disconnect(): Promise<void> {
		await clearTokens({ cookieStore });
		await clearAthlete({ cookieStore });
		logger.info("disconnected — cleared tokens and athlete cookie");
	}

	return {
		resolveAccessToken,
		fetchAllRowingActivities,
		fetchRecentRowingActivities,
		fetchAthlete,
		disconnect,
	};
}

function isStravaRowing(raw: unknown): boolean {
	if (!raw || typeof raw !== "object") return false;
	const record = raw as { type?: unknown; sport_type?: unknown };
	const sportType =
		typeof record.sport_type === "string" ? record.sport_type : "";
	const type = typeof record.type === "string" ? record.type : "";
	return ROWING_SPORT_TYPES.has(sportType) || ROWING_SPORT_TYPES.has(type);
}
