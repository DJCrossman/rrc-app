import { clerkClient } from "@clerk/nextjs/server";
import { envVars } from "@/lib/env";

/** A Clerk organization role, e.g. "org:admin" | "org:member", or null when not a member. */
export type DefaultOrgRole = string | null;

const ROLE_TTL_MS = 60_000;
const roleCache = new Map<
	string,
	{ role: DefaultOrgRole; expiresAt: number }
>();

export function getDefaultOrganizationId(): string {
	return envVars.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;
}

function cacheRole(userId: string, role: DefaultOrgRole) {
	roleCache.set(userId, { role, expiresAt: Date.now() + ROLE_TTL_MS });
}

async function fetchDefaultOrgRole(userId: string): Promise<DefaultOrgRole> {
	const client = await clerkClient();
	const memberships = await client.users.getOrganizationMembershipList({
		userId,
		limit: 100,
	});
	const membership = memberships.data.find(
		(entry) => entry.organization.id === getDefaultOrganizationId(),
	);
	return membership?.role ?? null;
}

/** The user's role in the default organization, cached briefly per user. */
export async function getDefaultOrgRole(
	userId: string,
): Promise<DefaultOrgRole> {
	const cached = roleCache.get(userId);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.role;
	}
	const role = await fetchDefaultOrgRole(userId);
	cacheRole(userId, role);
	return role;
}

/**
 * Admin status is derived from the default organization, not the ambient active
 * org — a self-signup that lands in a personal org must never read as admin.
 */
export async function isDefaultOrgAdmin(userId: string): Promise<boolean> {
	return (await getDefaultOrgRole(userId)) === "org:admin";
}

/**
 * Ensure the user is a member of the default organization. Never creates a new
 * organization — self-signups join the shared club org as a plain member.
 */
export async function ensureDefaultOrganizationMembership(
	userId: string,
): Promise<void> {
	if (await getDefaultOrgRole(userId)) {
		return;
	}
	const client = await clerkClient();
	try {
		await client.organizations.createOrganizationMembership({
			organizationId: getDefaultOrganizationId(),
			userId,
			role: "org:member",
		});
		cacheRole(userId, "org:member");
	} catch (error) {
		// Concurrent requests may both try to add the membership; drop the cached
		// miss so the next lookup reflects reality.
		console.error("Failed to add default organization membership:", error);
		roleCache.delete(userId);
	}
}
