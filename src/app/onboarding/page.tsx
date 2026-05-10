import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingScene } from "@/scenes/onboarding";

export default async function OnboardingPage() {
	const session = await auth();

	if (!session.userId) {
		redirect("/login");
	}

	if (session.has({ role: "org:admin" })) {
		redirect("/");
	}

	const existing = await db.athlete.findUnique({
		where: { userId: session.userId },
		select: { id: true },
	});
	if (existing) {
		redirect("/");
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(session.userId);

	return (
		<OnboardingScene
			defaultFirstName={clerkUser.firstName ?? undefined}
			defaultLastName={clerkUser.lastName ?? undefined}
		/>
	);
}
