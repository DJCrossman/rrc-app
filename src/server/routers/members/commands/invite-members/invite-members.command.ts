import type { InviteMembers } from "@/schemas";
import {
	describeClerkError,
	inviteOrganizationMember,
	listOrganizationMembers,
	listPendingInvitations,
	type PendingInvitation,
} from "@/server/clerk/organization-members";
import { getRequestOrigin } from "@/server/common/request-origin";
import type { AdminContext } from "@/server/context";

type SkippedInvite = { email: string; reason: string };
type InviteOutcome = { sent: PendingInvitation } | { skipped: SkippedInvite };

export async function inviteMembersCommand(
	{ emails, role }: InviteMembers,
	{ user }: AdminContext,
) {
	const [members, invitations, origin] = await Promise.all([
		listOrganizationMembers(),
		listPendingInvitations(),
		getRequestOrigin(),
	]);
	const memberEmails = new Set(
		members.flatMap((member) =>
			member.email ? [member.email.toLowerCase()] : [],
		),
	);
	const pendingEmails = new Set(
		invitations.map((invitation) => invitation.email.toLowerCase()),
	);

	const outcomes = await Promise.all(
		emails.map(async (email): Promise<InviteOutcome> => {
			if (memberEmails.has(email)) {
				return { skipped: { email, reason: "already a member" } };
			}
			if (pendingEmails.has(email)) {
				return { skipped: { email, reason: "already invited" } };
			}
			try {
				return {
					sent: await inviteOrganizationMember({
						email,
						role,
						inviterUserId: user.id,
						redirectUrl: `${origin}/signup`,
					}),
				};
			} catch (error) {
				return {
					skipped: {
						email,
						reason: describeClerkError(error, "could not be invited"),
					},
				};
			}
		}),
	);

	return {
		sent: outcomes.flatMap((outcome) =>
			"sent" in outcome ? [outcome.sent] : [],
		),
		skipped: outcomes.flatMap((outcome) =>
			"skipped" in outcome ? [outcome.skipped] : [],
		),
	};
}
