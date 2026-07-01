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

	await ensureDefaultOrganizationMembership(session.userId);
	return NextResponse.json({ ok: true });
}
