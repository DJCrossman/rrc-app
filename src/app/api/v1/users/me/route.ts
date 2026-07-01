import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerCaller } from "@/server/caller";
import { ensureDefaultOrganizationMembership } from "@/server/clerk/default-organization";

export async function GET() {
	try {
		const session = await auth();

		if (!session.userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await ensureDefaultOrganizationMembership(session.userId);

		const caller = await createServerCaller();
		const result = await caller.users.getCurrentUser();

		return NextResponse.json(result);
	} catch (error) {
		console.error("User info retrieval error:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve user info" },
			{ status: 500 },
		);
	}
}
