import { DateTime } from "luxon";
import type { StravaTokenData } from "@/app/api/v1/strava/types";
import { getStravaConfig } from "@/app/api/v1/strava/utils";
import { createLogger } from "@/lib/logger";
import {
	type StravaActivity,
	type StravaUser,
	stravaActivitySchema,
	stravaUserSchema,
} from "@/schemas";
import { decryptToken, encryptToken } from "@/server/integration-token-crypto";

const ROWING_SPORT_TYPES = new Set(["Rowing", "VirtualRow"]);

const logger = createLogger("strava.service");

export type StravaService = {
	refreshTokens: typeof refreshStravaTokens;
	fetchAllRowingActivities: typeof fetchAllRowingActivities;
	fetchRecentRowingActivities: typeof fetchRecentRowingActivities;
	fetchAthlete: typeof fetchStravaAthlete;
	encryptToken: typeof encryptToken;
	decryptToken: typeof decryptToken;
};

export function createStravaService(): StravaService {
	return {
		refreshTokens: refreshStravaTokens,
		fetchAllRowingActivities,
		fetchRecentRowingActivities,
		fetchAthlete: fetchStravaAthlete,
		encryptToken,
		decryptToken,
	};
}

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

async function refreshStravaTokens(
	refreshToken: string,
): Promise<StravaTokenData | null> {
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
	logger.info("token refresh succeeded", { expiresIn: tokenData.expires_in });
	return tokenData;
}

async function fetchAllRowingActivities(
	accessToken: string,
): Promise<StravaActivity[]> {
	logger.info("fetchAllRowingActivities start");
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

async function fetchRecentRowingActivities(
	accessToken: string,
): Promise<StravaActivity[]> {
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

async function fetchStravaAthlete(accessToken: string): Promise<StravaUser> {
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
	return parsed.data;
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

function isStravaRowing(raw: unknown): boolean {
	if (!raw || typeof raw !== "object") return false;
	const sport = (raw as Record<string, unknown>).sport_type;
	return typeof sport === "string" && ROWING_SPORT_TYPES.has(sport);
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
