import type { cookies } from "next/headers";
import { z } from "zod";
import {
	type Concept2TokenData,
	clearTokens,
	getAccessToken,
	getConcept2Config,
	getRefreshToken,
	getTokenExpiry,
	saveTokens,
} from "@/app/api/v1/concept2/utils";
import { createLogger } from "@/lib/logger";
import { type Concept2Activity, concept2ActivitySchema } from "@/schemas";

const REFRESH_BUFFER_MS = 60 * 60 * 1000;

const logger = createLogger("concept2.service");

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const responseSchema = z.object({
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

export type Concept2Service = {
	resolveAccessToken: () => Promise<string | null>;
	fetchAllResults: (type: "rower" | "water") => Promise<Concept2Activity[]>;
	disconnect: () => Promise<void>;
};

export function createConcept2Service({
	cookieStore,
}: {
	cookieStore: CookieStore;
}): Concept2Service {
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
		await saveTokens({ tokenData, cookieStore });
		logger.info("token refresh succeeded", {
			expiresIn: tokenData.expires_in,
		});
		return tokenData.access_token;
	}

	async function fetchAllResults(
		type: "rower" | "water",
	): Promise<Concept2Activity[]> {
		logger.info("fetchAllResults start", { type });
		const accessToken = await resolveAccessToken();
		if (!accessToken) {
			logger.error("fetchAllResults aborted — no access token", { type });
			throw new Error("Concept2 is not connected. Please reconnect.");
		}

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

			const parsed = responseSchema.safeParse(await response.json());
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

	async function disconnect(): Promise<void> {
		await clearTokens({ cookieStore });
		logger.info("disconnected — cleared tokens");
	}

	return { resolveAccessToken, fetchAllResults, disconnect };
}
