import { NextResponse } from "next/server";
import { envVars } from "@/lib/env";

export async function POST(request: Request) {
	try {
		const { code } = await request.json();

		// If no signup code is configured, allow any input
		if (envVars.SIGNUP_CODE && code !== envVars.SIGNUP_CODE) {
			return NextResponse.json(
				{
					error:
						"Invalid signup code. Please reach out to your administrator for assistance.",
				},
				{ status: 403 },
			);
		}

		return NextResponse.json({ valid: true });
	} catch (error) {
		console.error("Signup code verification error:", error);
		return NextResponse.json(
			{ error: "Failed to verify signup code" },
			{ status: 500 },
		);
	}
}
