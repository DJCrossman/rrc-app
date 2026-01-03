"use server";
import { type UpdateUser, type User, usersSchema } from "@/schemas";
import users from "./users.json";

const usersParsed = usersSchema.parse(users);

export async function getUserById(id: number): Promise<User | null> {
	const user = usersParsed.find((user) => user.id === id);
	return user ?? null;
}

export async function updateUserProfile(data: UpdateUser): Promise<User> {
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
