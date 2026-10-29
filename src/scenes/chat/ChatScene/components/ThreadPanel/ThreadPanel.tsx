"use client";

import { IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerCloseButton,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
} from "@/components/ui/drawer";
import type { ChatThread } from "@/lib/trpc/types";
import { useScrollToOwnMessage } from "../../hooks/useScrollToOwnMessage";
import {
	type ComposerSubmission,
	MessageComposer,
} from "../MessageComposer/MessageComposer";
import { MessageListSkeleton } from "../MessageList/MessageListSkeleton";
import {
	bindMessageHandlers,
	type MessageHandlers,
} from "../MessageRow/bindMessageHandlers";
import { MessageRow } from "../MessageRow/MessageRow";

interface ThreadPanelProps
	extends Omit<MessageHandlers, "onOpenThread" | "onQuote"> {
	channelName: string;
	thread: ChatThread | undefined;
	isLoading: boolean;
	isUnavailable: boolean;
	isMobile: boolean;
	onClose: () => void;
	onReply: (submission: ComposerSubmission) => Promise<unknown>;
}

export function ThreadPanel({ isMobile, ...props }: ThreadPanelProps) {
	if (isMobile) {
		return (
			<Drawer open onOpenChange={(open) => !open && props.onClose()}>
				<DrawerContent className="h-[calc(100svh-2.5rem)]">
					<ThreadContent
						{...props}
						header={
							<div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pt-2 pb-3">
								<div className="min-w-0">
									<DrawerTitle className="text-[22px] leading-tight font-bold tracking-tight">
										Thread
									</DrawerTitle>
									<DrawerDescription className="truncate text-[13px]">
										#{props.channelName}
									</DrawerDescription>
								</div>
								<DrawerCloseButton />
							</div>
						}
					/>
				</DrawerContent>
			</Drawer>
		);
	}
	return (
		<aside
			aria-label="Thread"
			className="hidden w-[380px] shrink-0 flex-col border-l md:flex"
		>
			<ThreadContent {...props} />
		</aside>
	);
}

function ThreadContent({
	channelName,
	thread,
	isLoading,
	isUnavailable,
	onClose,
	onReply,
	header,
	...handlers
}: Omit<ThreadPanelProps, "isMobile"> & { header?: ReactNode }) {
	const replyCount = thread?.replies.length ?? 0;
	const bottomRef = useScrollToOwnMessage(thread?.replies ?? []);
	return (
		<div className="flex h-full min-h-0 flex-1 flex-col">
			{header ?? (
				<div className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b px-4">
					<div className="flex min-w-0 items-baseline gap-2">
						<h2 className="text-[15px] font-semibold">Thread</h2>
						<span className="truncate text-[13px] text-muted-foreground">
							{channelName}
						</span>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-[30px] rounded-md"
						aria-label="Close thread"
						onClick={onClose}
					>
						<IconX />
					</Button>
				</div>
			)}
			<div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
				<div className="mb-auto py-4">
					{isLoading && <MessageListSkeleton rows={3} />}
					{isUnavailable && (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							This thread is no longer available.
						</p>
					)}
					{thread && (
						<>
							<MessageRow
								message={thread.root}
								showThreadSummary={false}
								compact
								{...bindMessageHandlers(handlers, thread.root)}
							/>
							<div className="flex items-center gap-2.5 px-4 pt-1 pb-2 text-xs text-muted-foreground">
								{replyCount} {replyCount === 1 ? "reply" : "replies"}
								<span className="h-px flex-1 bg-white/10" />
							</div>
							{thread.replies.map((reply) => (
								<MessageRow
									key={reply.id}
									message={reply}
									showThreadSummary={false}
									compact
									{...bindMessageHandlers(handlers, reply)}
								/>
							))}
						</>
					)}
					<div ref={bottomRef} />
				</div>
			</div>
			{thread && (
				<div className="shrink-0 px-4 pt-2 pb-4">
					<MessageComposer
						key={thread.root.id}
						placeholder="Reply…"
						alsoSendToLabel={`Also send to ${channelName}`}
						onSubmit={onReply}
					/>
				</div>
			)}
		</div>
	);
}
