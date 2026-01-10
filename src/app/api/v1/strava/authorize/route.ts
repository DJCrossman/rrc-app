import { NextResponse } from "next/server";
import { getStravaConfig } from "../utils";

export async function GET(request: Request) {
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
