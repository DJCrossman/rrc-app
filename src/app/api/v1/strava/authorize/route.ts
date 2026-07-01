import { NextResponse } from "next/server";
import { resolveOAuthReturnPath } from "@/lib/oauth-return";
import { createServerCaller } from "@/server/caller";
import { getStravaConfig } from "../utils";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const returnTo = resolveOAuthReturnPath(searchParams.get("returnTo"));

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

	const scope = searchParams.get("scope") || "read,activity:read";

	const config = getStravaConfig();

	const authUrl = new URL(config.authUrl);
	authUrl.searchParams.set("client_id", config.clientId);
	authUrl.searchParams.set("redirect_uri", config.callbackUrl);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("approval_prompt", "auto");
	authUrl.searchParams.set("scope", scope);
	authUrl.searchParams.set("state", returnTo);

	return NextResponse.redirect(authUrl.toString());
}
