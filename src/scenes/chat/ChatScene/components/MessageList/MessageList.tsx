"use client";

import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/trpc/types";
import { useScrollToOwnMessage } from "../../hooks/useScrollToOwnMessage";
import { groupMessagesByDay } from "../../utils/messageFormatting";
import {
	bindMessageHandlers,
	type MessageHandlers,
} from "../MessageRow/bindMessageHandlers";
import { MessageRow } from "../MessageRow/MessageRow";
import { MessageListSkeleton } from "./MessageListSkeleton";

interface MessageListProps extends MessageHandlers {
	messages: ChatMessage[];
	isLoading: boolean;
	hasOlder: boolean;
	isLoadingOlder: boolean;
	onLoadOlder: () => void;
	emptyState: ReactNode;
	highlightedMessageId?: string | null;
	firstUnreadMessageId?: string;
}

export function MessageList({
	messages,
	isLoading,
	hasOlder,
	isLoadingOlder,
	onLoadOlder,
	emptyState,
	highlightedMessageId,
	firstUnreadMessageId,
	...handlers
}: MessageListProps) {
	const bottomRef = useScrollToOwnMessage(messages);
	if (isLoading) {
		return <MessageListSkeleton />;
	}
	if (messages.length === 0) {
		return emptyState;
	}
	return (
		<div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
			<div className="mb-auto flex flex-col pt-4 pb-2">
				{hasOlder && (
					<div className="flex justify-center py-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onLoadOlder}
							disabled={isLoadingOlder}
						>
							{isLoadingOlder ? "Loading…" : "Load older messages"}
						</Button>
					</div>
				)}
				{groupMessagesByDay(messages).map((day) => (
					<section key={day.key} aria-label={day.label}>
						<div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground lg:px-6">
							<span className="h-px flex-1 bg-white/10" />
							{day.label}
							<span className="h-px flex-1 bg-white/10" />
						</div>
						{day.messages.map((message) => (
							<Fragment key={message.id}>
								{message.id === firstUnreadMessageId && (
									<div className="flex items-center gap-2 px-4 py-1 text-xs font-semibold text-destructive lg:px-6">
										<span className="h-px flex-1 bg-destructive" />
										New
									</div>
								)}
								<MessageRow
									message={message}
									isHighlighted={message.id === highlightedMessageId}
									{...bindMessageHandlers(handlers, message)}
								/>
							</Fragment>
						))}
					</section>
				))}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
