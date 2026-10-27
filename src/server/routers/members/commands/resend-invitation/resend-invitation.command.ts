import { TRPCError } from "@trpc/server";
import type { InvitationIdInput } from "@/schemas";
import { listPendingInvitations } from "@/server/clerk/organization-members";
import type { AdminContext } from "@/server/context";
import { inviteMembersCommand } from "../invite-members/invite-members.command";
import { revokeInvitationCommand } from "../revoke-invitation/revoke-invitation.command";

export async function resendInvitationCommand(
	{ invitationId }: InvitationIdInput,
	ctx: AdminContext,
) {
	const invitation = (await listPendingInvitations()).find(
		(candidate) => candidate.id === invitationId,
	);
	if (!invitation) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "That invitation is no longer pending",
		});
	}
	await revokeInvitationCommand({ invitationId }, ctx);
	const { sent, skipped } = await inviteMembersCommand(
		{ emails: [invitation.email.toLowerCase()], role: invitation.role },
		ctx,
	);
	const resent = sent[0];
	if (!resent) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: skipped[0]?.reason ?? "Could not resend the invitation",
		});
	}
	return resent;
}
