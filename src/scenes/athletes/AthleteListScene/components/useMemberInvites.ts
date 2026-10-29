"use client";

import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { trpcClient } from "@/lib/trpc/client";

export function useMemberInvites() {
	const utils = trpcClient.useUtils();
	const invite = trpcClient.members.invite.useMutation({
		onSuccess: async ({ sent, skipped }) => {
			const skippedSummary = skipped
				.map(({ email, reason }) => `${email}: ${reason}`)
				.join("\n");
			if (sent.length === 0) {
				toast.error("No invitations sent", { description: skippedSummary });
			} else {
				toast.success(
					sent.length === 1
						? `Invitation sent to ${sent[0].email}`
						: `${sent.length} invitations sent`,
					{ description: skippedSummary || undefined },
				);
			}
			await utils.members.getMembers.invalidate();
		},
		onError: toastError,
	});
	const resend = trpcClient.members.resendInvitation.useMutation({
		onSuccess: async (invitation) => {
			toast.success(`Invitation sent again to ${invitation.email}`);
			await utils.members.getMembers.invalidate();
		},
		onError: toastError,
	});
	const revoke = trpcClient.members.revokeInvitation.useMutation({
		onSuccess: async () => {
			toast.success("Invitation revoked");
			await utils.members.getMembers.invalidate();
		},
		onError: toastError,
	});

	return { invite, resend, revoke };
}
