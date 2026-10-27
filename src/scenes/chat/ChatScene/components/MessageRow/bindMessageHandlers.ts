import type { ChatMessage } from "@/lib/trpc/types";
import type { MessageActionHandlers } from "./MessageActions";

export interface MessageHandlers {
	onToggleReaction: (message: ChatMessage, emoji: string) => void;
	onOpenThread?: (message: ChatMessage) => void;
	onQuote?: (message: ChatMessage) => void;
	onMarkUnread?: (message: ChatMessage) => void;
	onForward: (message: ChatMessage) => void;
	onDelete: (message: ChatMessage) => void;
}

export function bindMessageHandlers(
	{
		onToggleReaction,
		onOpenThread,
		onQuote,
		onMarkUnread,
		onForward,
		onDelete,
	}: MessageHandlers,
	message: ChatMessage,
): MessageActionHandlers {
	return {
		onToggleReaction: (emoji) => onToggleReaction(message, emoji),
		onOpenThread: onOpenThread && (() => onOpenThread(message)),
		onQuote: onQuote && (() => onQuote(message)),
		onMarkUnread: onMarkUnread && (() => onMarkUnread(message)),
		onForward: () => onForward(message),
		onDelete: () => onDelete(message),
	};
}
