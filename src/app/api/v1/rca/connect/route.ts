import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { rcaLoginInputSchema } from "@/schemas";
import { createRcaService } from "@/server/services/rca-service";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const parsed = rcaLoginInputSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const cookieStore = await cookies();
	const rca = createRcaService({ cookieStore });
	const result = await rca.login(parsed.data);

	if (!result.ok) {
		const status = result.reason === "invalid_credentials" ? 401 : 502;
		return NextResponse.json({ error: result.reason }, { status });
	}

	return NextResponse.json({ ok: true });
}
