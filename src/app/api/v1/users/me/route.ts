import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { envVars } from "@/lib/env";
import { createServerCaller } from "@/server/caller";

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

const ensureDefaultOrganizationMembership = async (userId: string) => {
	const organizationId = envVars.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;
	const client = await clerkClient();
	const memberships = await client.users.getOrganizationMembershipList({
		userId,
		limit: 100,
	});

	const isMember = memberships.data.some(
		(membership) => membership.organization.id === organizationId,
	);

	if (isMember) {
		return;
	}

	await client.organizations.createOrganizationMembership({
		organizationId,
		userId,
		role: "org:member",
	});
};
