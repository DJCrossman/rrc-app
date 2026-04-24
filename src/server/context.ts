import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

export type Context = {
	userId: string | null;
	db: typeof db;
	cookieStore: Awaited<ReturnType<typeof cookies>>;
	headers: Headers;
};

export async function createTRPCContext(opts?: {
	req?: Request;
}): Promise<Context> {
	const { userId } = await auth();
	const cookieStore = await cookies();
	return {
		userId,
		db,
		cookieStore,
		headers: opts?.req?.headers ?? (await headers()),
	};
}
