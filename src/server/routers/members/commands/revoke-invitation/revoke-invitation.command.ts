import { TRPCError } from "@trpc/server";
import type { InvitationIdInput } from "@/schemas";
import {
	describeClerkError,
	revokeOrganizationInvitation,
} from "@/server/clerk/organization-members";
import type { AdminContext } from "@/server/context";

export async function revokeInvitationCommand(
	{ invitationId }: InvitationIdInput,
	{ user }: AdminContext,
) {
	try {
		await revokeOrganizationInvitation({
			invitationId,
			requestingUserId: user.id,
		});
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: describeClerkError(error, "Could not revoke the invitation"),
		});
	}
	return { invitationId };
}
