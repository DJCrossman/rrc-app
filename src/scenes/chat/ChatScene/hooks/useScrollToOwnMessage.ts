import { useEffect, useRef } from "react";

export function useScrollToOwnMessage(
	messages: { id: string; isMine: boolean }[],
) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const lastMessage = messages.at(-1);
	const ownMessageId = lastMessage?.isMine ? lastMessage.id : null;

	useEffect(() => {
		if (ownMessageId) {
			bottomRef.current?.scrollIntoView({ block: "end" });
		}
	}, [ownMessageId]);

	return bottomRef;
}
