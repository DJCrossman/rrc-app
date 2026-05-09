import { z } from "zod";
import { Concept2Error } from "@/app/api/v1/concept2/types";
import { createLogger } from "@/lib/logger";
import {
	type Concept2Activity,
	type Concept2User,
	concept2ActivitySchema,
	concept2UserSchema,
} from "@/schemas";

const logger = createLogger("concept2.service");

export interface Concept2TokenData {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

const resultsResponseSchema = z.object({
	data: z.array(concept2ActivitySchema),
	meta: z.object({
		pagination: z.object({
			total: z.number(),
			count: z.number(),
			per_page: z.number(),
			current_page: z.number(),
			total_pages: z.number(),
			links: z.array(z.unknown()),
		}),
	}),
});

const userResponseSchema = z.object({ data: concept2UserSchema });
const resultResponseSchema = z.object({ data: concept2ActivitySchema });

export type Concept2Service = {
	refreshTokens: (refreshToken: string) => Promise<Concept2TokenData | null>;
	fetchAllResults: (
		type: "rower" | "water",
		accessToken: string,
	) => Promise<Concept2Activity[]>;
	fetchResult: (
		accessToken: string,
		resultId: number | bigint,
	) => Promise<Concept2Activity | null>;
	fetchUser: (
		accessToken: string,
	) => Promise<PromiseSettledResult<Concept2User>>;
};

export function createConcept2Service(): Concept2Service {
	return { refreshTokens, fetchAllResults, fetchResult, fetchUser };
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

async function refreshTokens(
	refreshToken: string,
): Promise<Concept2TokenData | null> {
	const config = getConcept2Config();
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
	const tokenData = (await response.json()) as Concept2TokenData;
	logger.info("token refresh succeeded", { expiresIn: tokenData.expires_in });
	return tokenData;
}

async function fetchAllResults(
	type: "rower" | "water",
	accessToken: string,
): Promise<Concept2Activity[]> {
	logger.info("fetchAllResults start", { type });
	const config = getConcept2Config();
	const all: Concept2Activity[] = [];
	let page = 1;
	let totalPages = 1;

	do {
		const url = new URL(`${config.baseUrl}/api/users/me/results`);
		url.searchParams.set("type", type);
		url.searchParams.set("page", String(page));

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("results fetch failed", {
				type,
				page,
				status: response.status,
				body: errorText.slice(0, 500),
			});
			throw new Error(
				`Concept2 results fetch failed (${response.status}): ${errorText}`,
			);
		}

		const parsed = resultsResponseSchema.safeParse(await response.json());
		if (!parsed.success) {
			logger.error("results response validation failed", {
				type,
				page,
				issue: parsed.error.message,
			});
			throw new Error(`Invalid Concept2 response: ${parsed.error.message}`);
		}

		all.push(...parsed.data.data);
		totalPages = parsed.data.meta.pagination.total_pages;
		page += 1;

		if (totalPages > 5 && page <= totalPages) {
			await new Promise((resolve) => setTimeout(resolve, 150));
		}
	} while (page <= totalPages);

	logger.info("fetchAllResults complete", {
		type,
		totalActivities: all.length,
		totalPages,
	});
	return all;
}

async function fetchResult(
	accessToken: string,
	resultId: number | bigint,
): Promise<Concept2Activity | null> {
	const config = getConcept2Config();
	const url = new URL(
		`${config.baseUrl}/api/users/me/results/${resultId.toString()}`,
	);
	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		},
	});

	if (response.status === 404) {
		logger.info("result not found", { resultId: String(resultId) });
		return null;
	}
	if (!response.ok) {
		const errorText = await response.text().catch(() => "<unreadable>");
		logger.error("result fetch failed", {
			resultId: String(resultId),
			status: response.status,
			body: errorText.slice(0, 500),
		});
		throw new Error(
			`Concept2 result fetch failed (${response.status}): ${errorText}`,
		);
	}

	const parsed = resultResponseSchema.safeParse(await response.json());
	if (!parsed.success) {
		logger.warn("result response validation failed", {
			resultId: String(resultId),
			issue: parsed.error.message,
		});
		return null;
	}
	return parsed.data.data;
}

async function fetchUser(
	accessToken: string,
): Promise<PromiseSettledResult<Concept2User>> {
	const config = getConcept2Config();
	const url = new URL(`${config.baseUrl}/api/users/me`);
	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "<unreadable>");
		logger.error("user fetch failed", {
			status: response.status,
			body: errorText.slice(0, 500),
		});
		if (response.status === 401) {
			return {
				status: "rejected",
				reason: new Concept2Error({
					message: "Authentication required",
					auth_url: "/api/v1/concept2/auth",
					status: 401,
				}),
			};
		}
		return {
			status: "rejected",
			reason: new Concept2Error({
				message: "Failed to fetch user from Concept2",
				status: response.status,
			}),
		};
	}

	const parsed = userResponseSchema.safeParse(await response.json());
	if (!parsed.success) {
		logger.error("user response validation failed", {
			issue: parsed.error.message,
		});
		return {
			status: "rejected",
			reason: new Concept2Error({
				message: "Failed to parse Concept2 user",
				status: 500,
			}),
		};
	}

	return { status: "fulfilled", value: parsed.data.data };
}
