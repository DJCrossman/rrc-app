import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureDefaultOrganizationMembership } from "@/server/clerk/default-organization";

export async function POST() {
	// A newly-created user's session is `pending` until they belong to an org;
	// treat it as signed-in so we can read the userId and add the membership.
	const session = await auth({ treatPendingAsSignedOut: false });
	if (!session.userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const outcome = await ensureDefaultOrganizationMembership(session.userId);
	if (outcome === "full") {
		return NextResponse.json(
			{ error: "The club has no member spots left" },
			{ status: 409 },
		);
	}
	if (outcome === "failed") {
		return NextResponse.json(
			{ error: "Failed to join the club" },
			{ status: 502 },
		);
	}
	return NextResponse.json({ ok: true });
}
