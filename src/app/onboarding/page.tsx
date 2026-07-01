import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingScene } from "@/scenes/onboarding";
import { createServerCaller } from "@/server/caller";
import { ensureDefaultOrganizationMembership } from "@/server/clerk/default-organization";

export default async function OnboardingPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	// A brand-new user's session is `pending` until they belong to an org;
	// treat it as signed-in so we can add the default-org membership here.
	const session = await auth({ treatPendingAsSignedOut: false });

	if (!session.userId) {
		redirect("/login");
	}

	await ensureDefaultOrganizationMembership(session.userId);

	const { step } = await searchParams;
	const stepParam = Array.isArray(step) ? step[0] : step;

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(session.userId);

	const caller = await createServerCaller();
	const initialUser = await caller.users.getCurrentUser();

	return (
		<OnboardingScene
			step={stepParam}
			defaultFirstName={clerkUser.firstName ?? undefined}
			defaultLastName={clerkUser.lastName ?? undefined}
			initialUser={initialUser}
		/>
	);
}
