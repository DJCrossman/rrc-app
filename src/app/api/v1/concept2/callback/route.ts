import { NextResponse } from "next/server";
import { resolveOAuthReturnPath } from "@/lib/oauth-return";
import { createServerCaller } from "@/server/caller";
import {
	type Concept2TokenData,
	createConcept2Service,
	getConcept2Config,
} from "@/server/services/concept2-service";

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
			console.error("Concept2 OAuth error:", error, errorDescription);
			return redirectWithError(error, errorDescription ?? undefined);
		}

		if (!code) {
			console.error("No authorization code received");
			return redirectWithError("no_code");
		}

		const config = getConcept2Config();

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
				redirect_uri: config.callbackUrl,
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Token exchange failed:", tokenResponse.status, errorText);
			return redirectWithError("token_exchange_failed");
		}

		const tokenData: Concept2TokenData = await tokenResponse.json();

		const concept2 = createConcept2Service();
		const userResponse = await concept2.fetchUser(tokenData.access_token);
		if (userResponse.status === "rejected") {
			console.error(
				"Failed to fetch Concept2 user after token exchange:",
				userResponse.reason,
			);
			return redirectWithError("user_fetch_failed");
		}

		const caller = await createServerCaller();
		await caller.activities.connectConcept2({
			tokens: tokenData,
			concept2UserId: userResponse.value.id,
		});

		return NextResponse.redirect(new URL(returnTo, request.url));
	} catch (error) {
		console.error("Concept2 OAuth callback error:", error);
		return redirectWithError("callback_failed");
	}
}
