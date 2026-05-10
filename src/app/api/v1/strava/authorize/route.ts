import { NextResponse } from "next/server";
import { createServerCaller } from "@/server/caller";
import { getStravaConfig } from "../utils";

export async function GET(request: Request) {
	const caller = await createServerCaller();
	const [currentAthleteResult] = await Promise.allSettled([
		caller.athletes.getCurrentAthlete(),
	]);

	if (
		currentAthleteResult.status === "rejected" ||
		!currentAthleteResult.value
	) {
		const redirectUrl = new URL("/settings/apps", request.url);
		redirectUrl.searchParams.set("oauth_error", "no_athlete");
		return NextResponse.redirect(redirectUrl);
	}

	const { searchParams } = new URL(request.url);
	const scope = searchParams.get("scope") || "read,activity:read";

	const config = getStravaConfig();

	const authUrl = new URL(config.authUrl);
	authUrl.searchParams.set("client_id", config.clientId);
	authUrl.searchParams.set("redirect_uri", config.callbackUrl);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("approval_prompt", "auto");
	authUrl.searchParams.set("scope", scope);

	return NextResponse.redirect(authUrl.toString());
}
