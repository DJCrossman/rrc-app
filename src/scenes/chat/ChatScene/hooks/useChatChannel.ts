import { useMemo, useState } from "react";
import { toastError } from "@/lib/toast";
import { trpcClient } from "@/lib/trpc/client";
import { useMarkChannelRead } from "./useMarkChannelRead";

const MESSAGES_POLL_INTERVAL_MS = 5_000;
const MESSAGE_PAGE_SIZE = 50;

export function useChatChannel({
	channelId,
	threadMessageId,
	loadMembers,
}: {
	channelId: string;
	threadMessageId: string | null;
	loadMembers: boolean;
}) {
	const utils = trpcClient.useUtils();
	const [readMarker, setReadMarker] = useState<{
		channelId: string;
		lastReadAt: string | null;
	} | null>(null);

	const channelsQuery = trpcClient.chat.getChannels.useQuery();
	const channels = channelsQuery.data?.data ?? [];
	const channel = channels.find((item) => item.id === channelId);
	const messagesQuery = trpcClient.chat.getMessages.useInfiniteQuery(
		{ channelId, limit: MESSAGE_PAGE_SIZE },
		{
			getNextPageParam: (page) => page.nextCursor,
			refetchInterval: MESSAGES_POLL_INTERVAL_MS,
		},
	);
	const threadQuery = trpcClient.chat.getThread.useQuery(
		{ messageId: threadMessageId ?? "" },
		{ enabled: !!threadMessageId, refetchInterval: MESSAGES_POLL_INTERVAL_MS },
	);
	const membersQuery = trpcClient.chat.getMembers.useQuery(undefined, {
		enabled: loadMembers,
	});
	const messages = useMemo(
		() =>
			messagesQuery.data?.pages.flatMap((page) => page.data).reverse() ?? [],
		[messagesQuery.data],
	);

	const isFresh = messagesQuery.isSuccess && messagesQuery.isFetchedAfterMount;
	if (isFresh && readMarker?.channelId !== channelId) {
		setReadMarker({
			channelId,
			lastReadAt: messagesQuery.data.pages[0]?.lastReadAt ?? null,
		});
	}
	const lastReadAt =
		readMarker?.channelId === channelId ? readMarker.lastReadAt : null;
	const firstUnreadMessageId = lastReadAt
		? messages.find(
				(message) => !message.isMine && message.createdAt > lastReadAt,
			)?.id
		: undefined;

	useMarkChannelRead(
		channelId,
		isFresh ? (messagesQuery.data.pages[0]?.data[0]?.id ?? "") : null,
	);

	const refreshChannel = (id: string) =>
		Promise.all([
			utils.chat.getMessages.invalidate({ channelId: id }),
			utils.chat.getChannels.invalidate(),
		]);
	const sendMessage = trpcClient.chat.sendMessage.useMutation({
		onSuccess: () => refreshChannel(channelId),
		onError: toastError,
	});
	const replyInThread = trpcClient.chat.replyInThread.useMutation({
		onSuccess: () =>
			Promise.all([
				utils.chat.getThread.invalidate(),
				refreshChannel(channelId),
			]),
		onError: toastError,
	});
	const toggleReaction = trpcClient.chat.toggleReaction.useMutation({
		onSuccess: () =>
			Promise.all([
				utils.chat.getMessages.invalidate({ channelId }),
				utils.chat.getThread.invalidate(),
			]),
		onError: toastError,
	});
	const markUnread = trpcClient.chat.markUnread.useMutation({
		onSuccess: (result) => {
			setReadMarker(result);
			return utils.chat.getChannels.invalidate();
		},
		onError: toastError,
	});
	const startDm = trpcClient.chat.startDm.useMutation({ onError: toastError });
	const addDmMembers = trpcClient.chat.addDmMembers.useMutation({
		onSuccess: () => utils.chat.getChannels.invalidate(),
		onError: toastError,
	});
	const leaveDm = trpcClient.chat.leaveDm.useMutation({
		onSuccess: () => utils.chat.getChannels.invalidate(),
		onError: toastError,
	});
	const forwardMessage = trpcClient.chat.forwardMessage.useMutation({
		onSuccess: (result) => refreshChannel(result.channelId),
		onError: toastError,
	});
	const deleteMessage = trpcClient.chat.deleteMessage.useMutation({
		onSuccess: () =>
			Promise.all([
				utils.chat.getThread.invalidate(),
				refreshChannel(channelId),
			]),
		onError: toastError,
	});

	return {
		channels,
		channel,
		messages,
		firstUnreadMessageId,
		messagesQuery,
		threadQuery,
		membersQuery,
		sendMessage,
		replyInThread,
		toggleReaction,
		markUnread,
		startDm,
		addDmMembers,
		leaveDm,
		forwardMessage,
		deleteMessage,
	};
}
