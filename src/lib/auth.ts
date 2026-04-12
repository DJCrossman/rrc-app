import { auth } from "@clerk/nextjs/server";

/**
 * Protects server actions by requiring authentication
 * Throws an error if the user is not authenticated
 * @returns The Clerk user ID
 */
export async function requireAuth(): Promise<string> {
	const { userId } = await auth();

	if (!userId) {
		throw new Error("Unauthorized - Authentication required");
	}

	return userId;
}

/**
 * Gets the current authenticated user ID
 * Returns null if not authenticated
 * @returns The Clerk user ID or null
 */
export async function getCurrentUserId(): Promise<string | null> {
	const { userId } = await auth();
	return userId;
}
