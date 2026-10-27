import { invitationIdSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { resendInvitationCommand } from "./resend-invitation.command";

export const resendInvitationProcedure = adminProcedure
	.input(invitationIdSchema)
	.mutation(({ ctx, input }) => resendInvitationCommand(input, ctx));
