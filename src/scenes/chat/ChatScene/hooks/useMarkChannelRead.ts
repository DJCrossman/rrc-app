import { useEffect, useRef } from "react";
import { trpcClient } from "@/lib/trpc/client";

export function useMarkChannelRead(
	channelId: string,
	newestMessageId: string | null,
) {
	const utils = trpcClient.useUtils();
	const { mutate: markRead } = trpcClient.chat.markRead.useMutation({
		onSuccess: () => utils.chat.getChannels.invalidate(),
	});
	const lastMarked = useRef<string | null>(null);

	useEffect(() => {
		if (newestMessageId === null) return;
		const marker = `${channelId}:${newestMessageId}`;
		if (lastMarked.current === marker) return;
		lastMarked.current = marker;
		markRead({ channelId });
	}, [channelId, newestMessageId, markRead]);
}
