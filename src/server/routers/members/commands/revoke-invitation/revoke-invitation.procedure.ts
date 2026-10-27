import { invitationIdSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { revokeInvitationCommand } from "./revoke-invitation.command";

export const revokeInvitationProcedure = adminProcedure
	.input(invitationIdSchema)
	.mutation(({ ctx, input }) => revokeInvitationCommand(input, ctx));
