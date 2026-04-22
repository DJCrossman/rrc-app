"use server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { UpdateAthlete } from "@/schemas";
import { type CurrentAthlete, mapToUserDto } from "./utils";

const DEFAULT_PHONE_NUMBER = "+13065550123";
const DEFAULT_GENDER = "nonbinary" as const;
const DEFAULT_DATE_OF_BIRTH = new Date("1900-01-01T00:00:00.000Z");

export async function findOrCreateUserAndAthleteByClerkId(
	clerkUserId: string,
): Promise<CurrentAthlete> {
	const existingUser = await db.athlete.findUnique({ where: { clerkUserId } });
	if (existingUser) {
		return mapToUserDto(existingUser);
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkUserId);
	const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
	const emailLocalPart = clerkUser.primaryEmailAddress?.emailAddress
		?.split("@")[0]
		?.trim();
	const fallbackName = clerkUser.username?.trim() || emailLocalPart || "Member";
	const firstName = clerkUser.firstName?.trim() || fallbackName;
	const lastName = clerkUser.lastName?.trim() || "RRC";
	const nickname = clerkUser.firstName?.trim() || fallbackName;

	// Link to a pre-provisioned athlete by email if one exists
	if (email) {
		const existingByEmail = await db.athlete.findUnique({ where: { email } });
		if (existingByEmail) {
			const linked = await db.athlete.update({
				where: { id: existingByEmail.id },
				data: { clerkUserId },
			});
			return mapToUserDto(linked);
		}
	}

	const createdUser = await db.athlete.create({
		data: {
			clerkUserId,
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

export async function getUserById(id: string): Promise<CurrentAthlete> {
	const user = await db.athlete.findUnique({ where: { id } });
	if (!user) {
		throw new Error("User not found");
	}
	return mapToUserDto(user);
}

export async function getUserByClerkId(
	clerkUserId: string,
): Promise<CurrentAthlete | null> {
	const user = await db.athlete.findUnique({ where: { clerkUserId } });
	return user ? mapToUserDto(user) : null;
}

export async function updateUserProfile(
	data: UpdateAthlete,
): Promise<CurrentAthlete> {
	const updated = await db.athlete.update({
		where: { id: data.id },
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			nickname: data.nickname,
			phone: data.phone,
			email: data.email,
			gender: data.gender,
			dateOfBirth: new Date(data.dateOfBirth),
			dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined,
			heightInCm: data.heightInCm,
			weightInKg: data.weightInKg,
		},
	});
	return mapToUserDto(updated);
}
