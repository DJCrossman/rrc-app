"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";

type MessageTarget = { userId: string | null };

export function useMessageMember() {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const { user } = useCurrentUser();
	const startDm = trpcClient.chat.startDm.useMutation({
		onSuccess: async ({ channelId }) => {
			await utils.chat.getChannels.invalidate();
			router.push(routes.chat.channel(channelId));
		},
		onError: (error) => toast.error(error.message),
	});

	return {
		canMessage: (target: MessageTarget) =>
			!!target.userId && target.userId !== user.userId,
		message: (target: MessageTarget) => {
			if (target.userId) startDm.mutate({ userIds: [target.userId] });
		},
		isPending: startDm.isPending,
	};
}
