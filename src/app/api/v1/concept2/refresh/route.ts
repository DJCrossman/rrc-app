import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
	type Concept2TokenData,
	getConcept2Config,
	getRefreshToken,
	saveTokens,
} from "../utils";

export async function POST() {
	try {
		const cookieStore = await cookies();
		const refreshToken = await getRefreshToken({ cookieStore });

		if (!refreshToken) {
			return NextResponse.json(
				{ error: "No refresh token available" },
				{ status: 401 },
			);
		}

		const config = getConcept2Config();

		const tokenResponse = await fetch(config.tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken,
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Token refresh failed:", tokenResponse.status, errorText);
			return NextResponse.json(
				{ error: "Token refresh failed" },
				{ status: tokenResponse.status },
			);
		}

		const tokenData: Concept2TokenData = await tokenResponse.json();
		await saveTokens({ tokenData, cookieStore });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Concept2 token refresh error:", error);
		return NextResponse.json(
			{ error: "Failed to refresh token" },
			{ status: 500 },
		);
	}
}
