import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

export async function findOrLinkUserAthlete({
	userId,
	isAdmin,
}: {
	userId: string;
	isAdmin: boolean;
}) {
	const expectedRole = isAdmin ? "admin" : "member";

	const existing = await db.athlete.findUnique({ where: { userId } });
	if (existing) {
		if (existing.role !== expectedRole) {
			const synced = await db.athlete.update({
				where: { id: existing.id },
				data: { role: expectedRole },
			});
			return mapToUserDto(synced);
		}
		return mapToUserDto(existing);
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(userId);
	const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;

	if (email) {
		const existingByEmail = await db.athlete.findUnique({ where: { email } });
		if (existingByEmail) {
			const linked = await db.athlete.update({
				where: { id: existingByEmail.id },
				data: { userId, role: expectedRole },
			});
			return mapToUserDto(linked);
		}
	}

	return null;
}
