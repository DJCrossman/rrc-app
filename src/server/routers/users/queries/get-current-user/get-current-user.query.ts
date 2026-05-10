import { clerkClient } from "@clerk/nextjs/server";
import type { UnauthenticatedContext } from "@/server/common/context";
import { findOrLinkUserAthlete } from "../../commands/find-or-create-user-and-athlete-by-user-id/find-or-create-user-and-athlete-by-user-id.command";
import { synthesizeAdminUser } from "../../common/synthesize-admin-user";

export async function getCurrentUserQuery(
	_input: undefined,
	{ user }: UnauthenticatedContext,
) {
	if (!user) {
		return { user: null, isAdmin: false, hasAthlete: false };
	}

	const athlete = await findOrLinkUserAthlete({
		userId: user.id,
		isAdmin: user.isAdmin,
	});

	if (athlete) {
		return { user: athlete, isAdmin: user.isAdmin, hasAthlete: true };
	}

	if (user.isAdmin) {
		const client = await clerkClient();
		const clerkUser = await client.users.getUser(user.id);
		const synthesized = synthesizeAdminUser({
			userId: user.id,
			firstName: clerkUser.firstName,
			lastName: clerkUser.lastName,
			email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
		});
		return { user: synthesized, isAdmin: true, hasAthlete: false };
	}

	return { user: null, isAdmin: false, hasAthlete: false };
}
