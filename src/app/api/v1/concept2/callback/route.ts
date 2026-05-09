import { NextResponse } from "next/server";
import { createServerCaller } from "@/server/caller";
import {
	type Concept2TokenData,
	createConcept2Service,
	getConcept2Config,
} from "@/server/services/concept2-service";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		if (error) {
			console.error("Concept2 OAuth error:", error, errorDescription);
			const redirectUrl = new URL("/settings/apps", request.url);
			redirectUrl.searchParams.set("oauth_error", error);
			if (errorDescription) {
				redirectUrl.searchParams.set(
					"oauth_error_description",
					errorDescription,
				);
			}
			return NextResponse.redirect(redirectUrl);
		}

		if (!code) {
			console.error("No authorization code received");
			const redirectUrl = new URL("/settings/apps", request.url);
			redirectUrl.searchParams.set("oauth_error", "no_code");
			return NextResponse.redirect(redirectUrl);
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
			const redirectUrl = new URL("/settings/apps", request.url);
			redirectUrl.searchParams.set("oauth_error", "token_exchange_failed");
			return NextResponse.redirect(redirectUrl);
		}

		const tokenData: Concept2TokenData = await tokenResponse.json();

		const concept2 = createConcept2Service();
		const userResponse = await concept2.fetchUser(tokenData.access_token);
		if (userResponse.status === "rejected") {
			console.error(
				"Failed to fetch Concept2 user after token exchange:",
				userResponse.reason,
			);
			const redirectUrl = new URL("/settings/apps", request.url);
			redirectUrl.searchParams.set("oauth_error", "user_fetch_failed");
			return NextResponse.redirect(redirectUrl);
		}

		const caller = await createServerCaller();
		await caller.activities.connectConcept2({
			tokens: tokenData,
			concept2UserId: userResponse.value.id,
		});

		return NextResponse.redirect(new URL("/settings/apps", request.url));
	} catch (error) {
		console.error("Concept2 OAuth callback error:", error);
		const redirectUrl = new URL("/settings/apps", request.url);
		redirectUrl.searchParams.set("oauth_error", "callback_failed");
		return NextResponse.redirect(redirectUrl);
	}
}
