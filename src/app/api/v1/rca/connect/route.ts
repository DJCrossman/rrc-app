import { TRPCError } from "@trpc/server";
import { NextResponse } from "next/server";
import { connectRcaInputSchema } from "@/schemas";
import { createServerCaller } from "@/server/caller";

export async function POST(request: Request) {
	const caller = await createServerCaller();

	const [currentAthleteResult] = await Promise.allSettled([
		caller.athletes.getCurrentAthlete(),
	]);

	if (
		currentAthleteResult.status === "rejected" ||
		!currentAthleteResult.value
	) {
		return NextResponse.json(
			{ error: "Athlete account required" },
			{ status: 400 },
		);
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
