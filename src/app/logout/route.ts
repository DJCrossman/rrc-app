import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const referer = request.headers.get("referer") || "";

	// Tell Next.js to purge the entire cache
	revalidatePath("/", "layout");

	// Redirect to login page
	const destination = new URL("/login", referer);

	return NextResponse.redirect(destination, {
		headers: {
			// Clear browser site data
			"Clear-Site-Data": '"*"',
			// Clear Next.js client cache
			"Cache-Control": "no-store",
		},
	});
}
