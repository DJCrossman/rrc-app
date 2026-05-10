import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const isPublicRoute = createRouteMatcher([
	"/login(.*)",
	"/signup(.*)",
	"/api/(.*)",
	"/trpc/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	if (isPublicRoute(req)) {
		return;
	}

	await auth.protect({
		unauthenticatedUrl: new URL("/login", req.url).toString(),
	});

	if (req.nextUrl.pathname.startsWith("/onboarding")) {
		return;
	}

	const session = await auth();
	if (!session.userId) {
		return;
	}

	if (session.has({ role: "org:admin" })) {
		return;
	}

	const athlete = await db.athlete.findUnique({
		where: { userId: session.userId },
		select: { id: true },
	});
	if (!athlete) {
		return NextResponse.redirect(new URL("/onboarding", req.url));
	}
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
