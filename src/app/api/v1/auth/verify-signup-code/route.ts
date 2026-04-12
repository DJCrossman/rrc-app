import { NextResponse } from "next/server";
import { envVars } from "@/lib/env";

export async function POST(request: Request) {
	try {
		const { code } = await request.json();

		if (!code) {
			return NextResponse.json(
				{ error: "Signup code is required" },
				{ status: 400 },
			);
		}

		// Verify the code matches the stored UUID
		const isValid = code === envVars.SIGNUP_CODE;

		if (!isValid) {
			return NextResponse.json(
				{
					error:
						"Invalid signup code. Please reach out to the Regina Rowing Club for assistance.",
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
