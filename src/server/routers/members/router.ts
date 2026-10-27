import { router } from "@/server/trpc";
import { inviteMembersProcedure } from "./commands/invite-members/invite-members.procedure";
import { resendInvitationProcedure } from "./commands/resend-invitation/resend-invitation.procedure";
import { revokeInvitationProcedure } from "./commands/revoke-invitation/revoke-invitation.procedure";
import { getMembersProcedure } from "./queries/get-members/get-members.procedure";

export const membersRouter = router({
	getMembers: getMembersProcedure,
	invite: inviteMembersProcedure,
	resendInvitation: resendInvitationProcedure,
	revokeInvitation: revokeInvitationProcedure,
});
