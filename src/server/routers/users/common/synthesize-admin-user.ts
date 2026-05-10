import type { mapToUserDto } from "./map-to-user-dto";

type UserDto = ReturnType<typeof mapToUserDto>;

export function synthesizeAdminUser({
	userId,
	firstName,
	lastName,
	email,
}: {
	userId: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}): UserDto {
	return {
		id: "",
		userId,
		firstName: firstName?.trim() || "Admin",
		lastName: lastName?.trim() || "",
		nickname: firstName?.trim() || null,
		phone: "",
		email,
		role: "admin",
		gender: "nonbinary",
		dateOfBirth: new Date(0).toISOString(),
		dateJoined: undefined,
		heightInCm: null,
		weightInKg: null,
		concept2UserId: null,
		stravaAthleteId: null,
		concept2Connected: false,
		stravaConnected: false,
		rcaConnected: false,
	};
}
