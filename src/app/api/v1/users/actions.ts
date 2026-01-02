"use server";
import { type User, usersSchema } from "@/schemas";
import users from "./users.json";

const usersParsed = usersSchema.parse(users);

export async function getUserById(id: number): Promise<User | null> {
	const user = usersParsed.find((user) => user.id === id);
	return user ?? null;
}

export async function getCurrentUser(): Promise<User> {
	// TODO: Replace with actual authentication logic
	const firstUserId = usersParsed[0];

	const user = await getUserById(firstUserId.id);
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}

export async function updateUserProfile(data: Partial<User>): Promise<User> {
	// TODO: Replace with actual database update logic
	// For now, simulate a successful update by returning the updated data
	const currentUser = await getCurrentUser();

	const updatedUser = {
		...currentUser,
		...data,
	};

	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	return updatedUser;
}
