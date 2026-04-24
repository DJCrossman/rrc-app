import type { athlete } from "@/generated/prisma/client";

export function mapToUserDto(user: athlete) {
	return {
		id: user.id,
		userId: user.userId,
		firstName: user.firstName,
		lastName: user.lastName,
		nickname: user.nickname,
		phone: user.phone,
		email: user.email,
		role: user.role,
		gender: user.gender,
		dateOfBirth: user.dateOfBirth.toISOString(),
		dateJoined: user.dateJoined?.toISOString(),
		heightInCm: user.heightInCm,
		weightInKg: user.weightInKg,
		concept2UserId: user.concept2UserId,
		stravaAthleteId: user.stravaAthleteId,
		concept2Connected: user.concept2UserId !== null,
		stravaConnected: user.stravaAthleteId !== null,
	};
}
