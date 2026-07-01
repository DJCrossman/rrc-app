import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDefaultOrgAdmin } from "@/server/clerk/default-organization";

const isPublicRoute = createRouteMatcher([
	"/login(.*)",
	"/signup(.*)",
	"/onboarding(.*)",
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

	const session = await auth();
	if (!session.userId) {
		return;
	}

	if (await isDefaultOrgAdmin(session.userId)) {
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
