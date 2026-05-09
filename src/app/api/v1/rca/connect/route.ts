import { auth } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { NextResponse } from "next/server";
import { connectRcaInputSchema } from "@/schemas";
import { createServerCaller } from "@/server/caller";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const parsed = connectRcaInputSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	try {
		const caller = await createServerCaller();
		await caller.activities.connectRca(parsed.data);
		return NextResponse.json({ ok: true });
	} catch (err) {
		if (err instanceof TRPCError) {
			const status = err.code === "UNAUTHORIZED" ? 401 : 502;
			return NextResponse.json({ error: err.message }, { status });
		}
		throw err;
	}
}
