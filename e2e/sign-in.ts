import type { Page } from "@playwright/test";

/**
 * Sign in with the session `bun run instance:e2e` minted from the instance's
 * Clerk emulator, by planting the cookies Clerk's middleware reads.
 */
export async function signInAs(page: Page, role: "admin" | "member") {
	const session =
		role === "admin"
			? process.env.E2E_ADMIN_SESSION
			: process.env.E2E_MEMBER_SESSION;
	if (!session) {
		throw new Error(
			`No ${role} session. Run the suite with \`bun run instance:e2e\`.`,
		);
	}
	await page.context().addCookies(
		[
			{ name: "__session", value: session },
			{ name: "__client_uat", value: "1" },
			{ name: "__clerk_db_jwt", value: "e2e" },
		].map((cookie) => ({ ...cookie, url: process.env.E2E_BASE_URL })),
	);
}
