import { NextResponse } from "next/server";
import { resolveOAuthReturnPath } from "@/lib/oauth-return";
import { createServerCaller } from "@/server/caller";
import { getConcept2Config } from "@/server/services/concept2-service";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const returnTo = resolveOAuthReturnPath(searchParams.get("returnTo"));

	try {
		const caller = await createServerCaller();
		const [currentAthleteResult] = await Promise.allSettled([
			caller.athletes.getCurrentAthlete(),
		]);

		if (
			currentAthleteResult.status === "rejected" ||
			!currentAthleteResult.value
		) {
			const redirectUrl = new URL(returnTo, request.url);
			redirectUrl.searchParams.set("oauth_error", "no_athlete");
			return NextResponse.redirect(redirectUrl);
		}

		const scope = searchParams.get("scope") || "results:read,user:read";

		const config = getConcept2Config();

		const authUrl = new URL(config.authUrl);
		authUrl.searchParams.set("client_id", config.clientId);
		authUrl.searchParams.set("redirect_uri", config.callbackUrl);
		authUrl.searchParams.set("response_type", "code");
		authUrl.searchParams.set("scope", scope);
		authUrl.searchParams.set("state", returnTo);

		return NextResponse.redirect(authUrl.toString());
	} catch (error) {
		console.error("Concept2 OAuth authorization error:", error);
		return NextResponse.json(
			{ error: "Failed to initiate OAuth flow" },
			{ status: 500 },
		);
	}
}
