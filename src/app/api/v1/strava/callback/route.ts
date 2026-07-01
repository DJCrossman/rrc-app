import { NextResponse } from "next/server";
import { resolveOAuthReturnPath } from "@/lib/oauth-return";
import { createServerCaller } from "@/server/caller";
import type { StravaTokenData } from "../types";
import { getStravaConfig } from "../utils";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const returnTo = resolveOAuthReturnPath(searchParams.get("state"));

	const redirectWithError = (code: string, description?: string) => {
		const redirectUrl = new URL(returnTo, request.url);
		redirectUrl.searchParams.set("oauth_error", code);
		if (description) {
			redirectUrl.searchParams.set("oauth_error_description", description);
		}
		return NextResponse.redirect(redirectUrl);
	};

	try {
		const code = searchParams.get("code");
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		if (error) {
			console.error("Strava OAuth error:", error, errorDescription);
			return redirectWithError(error, errorDescription ?? undefined);
		}

		if (!code) {
			console.error("No authorization code received");
			return redirectWithError("no_code");
		}

		const config = getStravaConfig();

		const tokenResponse = await fetch(config.tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Token exchange failed:", tokenResponse.status, errorText);
			return redirectWithError("token_exchange_failed");
		}

		const tokenData: StravaTokenData = await tokenResponse.json();

		const caller = await createServerCaller();
		await caller.activities.connectStrava({
			tokens: tokenData,
			athlete: tokenData.athlete,
		});

		return NextResponse.redirect(new URL(returnTo, request.url));
	} catch (error) {
		console.error("Strava OAuth callback error:", error);
		return redirectWithError("callback_error");
	}
}
