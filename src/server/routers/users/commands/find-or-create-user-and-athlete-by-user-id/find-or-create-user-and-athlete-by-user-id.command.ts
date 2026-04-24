import { clerkClient } from "@clerk/nextjs/server";
import type { Context } from "@/server/context";
import { mapToUserDto } from "@/server/routers/users/common/map-to-user-dto";

const DEFAULT_PHONE_NUMBER = "+13065550123";
const DEFAULT_GENDER = "nonbinary" as const;
const DEFAULT_DATE_OF_BIRTH = new Date("1900-01-01T00:00:00.000Z");

export async function findOrCreateUserAndAthleteByUserIdCommand(
	_input: undefined,
	{ db, userId }: Context,
) {
	if (!userId) throw new Error("Unauthenticated");

	const existingUser = await db.athlete.findUnique({ where: { userId } });
	if (existingUser) {
		return mapToUserDto(existingUser);
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(userId);
	const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
	const emailLocalPart = clerkUser.primaryEmailAddress?.emailAddress
		?.split("@")[0]
		?.trim();
	const fallbackName = clerkUser.username?.trim() || emailLocalPart || "Member";
	const firstName = clerkUser.firstName?.trim() || fallbackName;
	const lastName = clerkUser.lastName?.trim() || "RRC";
	const nickname = clerkUser.firstName?.trim() || fallbackName;

	if (email) {
		const existingByEmail = await db.athlete.findUnique({ where: { email } });
		if (existingByEmail) {
			const linked = await db.athlete.update({
				where: { id: existingByEmail.id },
				data: { userId },
			});
			return mapToUserDto(linked);
		}
	}

	const createdUser = await db.athlete.create({
		data: {
			userId,
			firstName,
			lastName,
			nickname,
			email,
			phone: clerkUser.primaryPhoneNumber?.phoneNumber || DEFAULT_PHONE_NUMBER,
			gender: DEFAULT_GENDER,
			dateOfBirth: DEFAULT_DATE_OF_BIRTH,
			dateJoined: new Date(),
		},
	});

	return mapToUserDto(createdUser);
}
