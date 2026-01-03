import { NextResponse } from "next/server";
import { getConcept2Config } from "../utils";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const scope = searchParams.get("scope") || "results:read,user:read";

		const config = getConcept2Config();

		const authUrl = new URL(config.authUrl);
		authUrl.searchParams.set("client_id", config.clientId);
		authUrl.searchParams.set("redirect_uri", config.callbackUrl);
		authUrl.searchParams.set("response_type", "code");
		authUrl.searchParams.set("scope", scope);

		return NextResponse.redirect(authUrl.toString());
	} catch (error) {
		console.error("Concept2 OAuth authorization error:", error);
		return NextResponse.json(
			{ error: "Failed to initiate OAuth flow" },
			{ status: 500 },
		);
	}
}
