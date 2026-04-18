"use server";
import { type Athlete, athletesSchema, type UpdateAthlete } from "@/schemas";
import athletes from "../athletes/athletes.json";

const usersParsed = athletesSchema.parse(athletes);

export async function getUserById(id: number): Promise<Athlete> {
	const user = usersParsed.find((user) => user.id === id);
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}

export async function updateUserProfile(data: UpdateAthlete): Promise<Athlete> {
	const currentUser = await getUserById(data.id);

	if (!currentUser) {
		throw new Error("User not found");
	}

	const updatedUser = {
		...currentUser,
		...data,
	};

	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	return updatedUser;
}
