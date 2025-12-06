"use server";
import { type User, usersSchema } from "@/schemas";
import users from "./users.json";

const usersParsed = usersSchema.parse(users);

export async function getUserById(id: number): Promise<User | null> {
	const user = usersParsed.find((user) => user.id === id);
	return user ?? null;
}
