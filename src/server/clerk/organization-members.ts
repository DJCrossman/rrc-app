import { clerkClient } from "@clerk/nextjs/server";
import type { InviteRole } from "@/schemas";
import { getDefaultOrganizationId } from "./default-organization";

export interface OrganizationMember {
	userId: string;
	isAdmin: boolean;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	joinedAt: string;
}

export interface PendingInvitation {
	id: string;
	email: string;
	role: InviteRole;
	invitedAt: string;
}

const CACHE_TTL_MS = 60_000;
const PAGE_SIZE = 500;

let membersCache: { value: OrganizationMember[]; expiresAt: number } | null =
	null;
let invitationsCache: { value: PendingInvitation[]; expiresAt: number } | null =
	null;

export async function listOrganizationMembers(): Promise<OrganizationMember[]> {
	if (membersCache && membersCache.expiresAt > Date.now()) {
		return membersCache.value;
	}
	const client = await clerkClient();
	const memberships = await fetchAllPages((offset) =>
		client.organizations.getOrganizationMembershipList({
			organizationId: getDefaultOrganizationId(),
			limit: PAGE_SIZE,
			offset,
		}),
	);
	const value = memberships.flatMap((membership) => {
		const user = membership.publicUserData;
		if (!user) return [];
		return [
			{
				userId: user.userId,
				isAdmin: membership.role === "org:admin",
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.identifier.includes("@") ? user.identifier : null,
				joinedAt: new Date(membership.createdAt).toISOString(),
			},
		];
	});
	membersCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
	return value;
}

export async function listPendingInvitations(): Promise<PendingInvitation[]> {
	if (invitationsCache && invitationsCache.expiresAt > Date.now()) {
		return invitationsCache.value;
	}
	const client = await clerkClient();
	const invitations = await fetchAllPages((offset) =>
		client.organizations.getOrganizationInvitationList({
			organizationId: getDefaultOrganizationId(),
			status: ["pending"],
			limit: PAGE_SIZE,
			offset,
		}),
	);
	const value = invitations.map((invitation) => ({
		id: invitation.id,
		email: invitation.emailAddress,
		role: toInviteRole(invitation.role),
		invitedAt: new Date(invitation.createdAt).toISOString(),
	}));
	invitationsCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
	return value;
}

export async function inviteOrganizationMember({
	email,
	role,
	inviterUserId,
	redirectUrl,
}: {
	email: string;
	role: InviteRole;
	inviterUserId: string;
	redirectUrl: string;
}): Promise<PendingInvitation> {
	const client = await clerkClient();
	const invitation = await client.organizations.createOrganizationInvitation({
		organizationId: getDefaultOrganizationId(),
		emailAddress: email,
		role: role === "admin" ? "org:admin" : "org:member",
		inviterUserId,
		redirectUrl,
	});
	invitationsCache = null;
	return {
		id: invitation.id,
		email: invitation.emailAddress,
		role: toInviteRole(invitation.role),
		invitedAt: new Date(invitation.createdAt).toISOString(),
	};
}

export async function revokeOrganizationInvitation({
	invitationId,
	requestingUserId,
}: {
	invitationId: string;
	requestingUserId: string;
}): Promise<void> {
	const client = await clerkClient();
	await client.organizations.revokeOrganizationInvitation({
		organizationId: getDefaultOrganizationId(),
		invitationId,
		requestingUserId,
	});
	invitationsCache = null;
}

export function describeClerkError(error: unknown, fallback: string): string {
	if (typeof error === "object" && error !== null && "errors" in error) {
		const { errors } = error as {
			errors?: { longMessage?: string; message?: string }[];
		};
		const first = errors?.[0];
		if (first?.longMessage || first?.message) {
			return first.longMessage ?? first.message ?? fallback;
		}
	}
	return fallback;
}

function toInviteRole(role: string): InviteRole {
	return role === "org:admin" ? "admin" : "member";
}

async function fetchAllPages<T>(
	fetchPage: (offset: number) => Promise<{ data: T[]; totalCount: number }>,
): Promise<T[]> {
	const items: T[] = [];
	for (let offset = 0; ; offset += PAGE_SIZE) {
		const page = await fetchPage(offset);
		items.push(...page.data);
		if (page.data.length < PAGE_SIZE || items.length >= page.totalCount) {
			return items;
		}
	}
}
