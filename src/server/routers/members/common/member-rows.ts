import type {
	OrganizationMember,
	PendingInvitation,
} from "@/server/clerk/organization-members";
import type { mapToAthleteWithGroups } from "@/server/routers/athletes/common/map-to-athlete-with-groups";
import { getDisplayName } from "@/server/routers/chat/common/chat-user-names";

export type MemberAthlete = ReturnType<typeof mapToAthleteWithGroups>;
export type MemberAccount = "user" | "invited" | "none";

export interface MemberRow {
	id: string;
	userId: string | null;
	athleteId: string | null;
	invitationId: string | null;
	name: string;
	email: string | null;
	isAdmin: boolean;
	account: MemberAccount;
	athlete: MemberAthlete | null;
	invitedAt: string | null;
}

export function mergeMembers({
	users,
	invitations,
	athletes,
}: {
	users: OrganizationMember[];
	invitations: PendingInvitation[];
	athletes: MemberAthlete[];
}): MemberRow[] {
	const athletesByUserId = new Map<string, MemberAthlete>();
	const unlinkedByEmail = new Map<string, MemberAthlete>();
	for (const athlete of athletes) {
		if (athlete.userId) {
			athletesByUserId.set(athlete.userId, athlete);
		} else if (athlete.email) {
			unlinkedByEmail.set(athlete.email.toLowerCase(), athlete);
		}
	}
	const claimed = new Set<string>();

	const rows: MemberRow[] = users.map((user) => {
		const email = user.email?.toLowerCase();
		const athlete =
			athletesByUserId.get(user.userId) ??
			(email ? unlinkedByEmail.get(email) : undefined) ??
			null;
		if (athlete) claimed.add(athlete.id);
		return {
			id: user.userId,
			userId: user.userId,
			athleteId: athlete?.id ?? null,
			invitationId: null,
			name: athlete ? getDisplayName(athlete) : getUserName(user),
			email: user.email ?? athlete?.email ?? null,
			isAdmin: user.isAdmin,
			account: "user",
			athlete,
			invitedAt: null,
		};
	});

	const memberEmails = new Set(
		users.flatMap((user) => (user.email ? [user.email.toLowerCase()] : [])),
	);
	for (const invitation of invitations) {
		const email = invitation.email.toLowerCase();
		if (memberEmails.has(email)) continue;
		const athlete = unlinkedByEmail.get(email);
		if (athlete && !claimed.has(athlete.id)) {
			claimed.add(athlete.id);
			rows.push({
				id: athlete.id,
				userId: null,
				athleteId: athlete.id,
				invitationId: invitation.id,
				name: getDisplayName(athlete),
				email: athlete.email,
				isAdmin: invitation.role === "admin",
				account: "invited",
				athlete,
				invitedAt: invitation.invitedAt,
			});
		} else {
			rows.push({
				id: invitation.id,
				userId: null,
				athleteId: null,
				invitationId: invitation.id,
				name: invitation.email,
				email: invitation.email,
				isAdmin: invitation.role === "admin",
				account: "invited",
				athlete: null,
				invitedAt: invitation.invitedAt,
			});
		}
	}

	for (const athlete of athletes) {
		if (claimed.has(athlete.id)) continue;
		rows.push({
			id: athlete.id,
			userId: athlete.userId,
			athleteId: athlete.id,
			invitationId: null,
			name: getDisplayName(athlete),
			email: athlete.email,
			isAdmin: athlete.role === "admin",
			account: athlete.userId ? "user" : "none",
			athlete,
			invitedAt: null,
		});
	}

	return rows;
}

export function filterMembers(
	rows: MemberRow[],
	{
		search,
		programIds,
		isActive,
	}: { search?: string; programIds?: string[]; isActive?: boolean },
): MemberRow[] {
	const terms = search?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
	return rows.filter((row) => {
		if (
			programIds?.length &&
			!row.athlete?.memberships.some((m) => programIds.includes(m.programId))
		) {
			return false;
		}
		if (
			isActive !== undefined &&
			!!row.athlete?.activeMembership !== isActive
		) {
			return false;
		}
		const haystack = [
			row.name,
			row.email,
			row.athlete?.firstName,
			row.athlete?.lastName,
			row.athlete?.nickname,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return terms.every((term) => haystack.includes(term));
	});
}

export function sortMembers(
	rows: MemberRow[],
	{
		sortBy = "name",
		order = "asc",
	}: { sortBy?: "name" | "dateJoined"; order?: "asc" | "desc" },
): MemberRow[] {
	const direction = order === "desc" ? -1 : 1;
	return [...rows].sort((a, b) => {
		if (sortBy === "dateJoined") {
			const aJoined = a.athlete?.dateJoined;
			const bJoined = b.athlete?.dateJoined;
			if (aJoined && !bJoined) return -1;
			if (!aJoined && bJoined) return 1;
			if (aJoined && bJoined && aJoined !== bJoined) {
				return aJoined.localeCompare(bJoined) * direction;
			}
		}
		return a.name.localeCompare(b.name) * direction;
	});
}

function getUserName(user: OrganizationMember): string {
	return (
		[user.firstName, user.lastName].filter(Boolean).join(" ") ||
		user.email ||
		"Club member"
	);
}
