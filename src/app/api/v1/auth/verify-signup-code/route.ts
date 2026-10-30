import { NextResponse } from "next/server";
import { isValidSignupCode } from "@/lib/auth";

export async function POST(request: Request) {
	try {
		const { code } = await request.json();

		if (!isValidSignupCode(code)) {
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
