"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { PeoplePickerDialog } from "@/components/chat/people-picker-dialog";
import { NotificationsBanner } from "@/components/notifications-banner";
import { SiteHeader } from "@/components/site-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { routes } from "@/lib/routes";
import type { ChatChannel, ChatMessage } from "@/lib/trpc/types";
import { MAX_DM_MEMBERS } from "@/schemas/chat.schema";
import {
	ChatEmptyState,
	ChatHeader,
	DeleteMessageDialog,
	ForwardDialog,
	MessageComposer,
	MessageList,
	ThreadPanel,
} from "./components";
import { useChatChannel } from "./hooks/useChatChannel";

interface ChatSceneProps {
	channelId: string;
	threadMessageId: string | null;
}

export const ChatScene = ({ channelId, threadMessageId }: ChatSceneProps) => {
	const router = useRouter();
	const isMobile = useIsMobile();
	const [quote, setQuote] = useState<ChatMessage | null>(null);
	const [forwardingMessage, setForwardingMessage] =
		useState<ChatMessage | null>(null);
	const [isAddingPeople, setIsAddingPeople] = useState(false);
	const [shareHistory, setShareHistory] = useState(true);
	const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(
		null,
	);
	const {
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
	} = useChatChannel({
		channelId,
		threadMessageId,
		loadMembers: !!forwardingMessage,
	});
	const { isAdmin } = useCurrentUser();
	const quotedMessage = quote?.channelId === channelId ? quote : null;
	const channelName = channel?.name ?? "";
	const isUnavailable = messagesQuery.error?.data?.code === "NOT_FOUND";

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset className="h-svh overflow-hidden md:h-[calc(100svh-1rem)]">
				<SiteHeader breadcrumbs={getBreadcrumbs(channel, isAdmin)} />
				<ChatHeader
					channel={channel}
					onAddPeople={() => {
						setShareHistory(true);
						setIsAddingPeople(true);
					}}
					onLeave={() =>
						leaveDm.mutate(
							{ channelId },
							{
								onSuccess: () => {
									toast.success("You left the conversation");
									router.push(routes.chat.everyone());
								},
							},
						)
					}
				/>
				<NotificationsBanner className="mx-4 mt-3 w-auto lg:mx-6" />
				<div className="flex min-h-0 flex-1">
					<section
						aria-label={channelName || "Chat"}
						className="flex min-w-0 flex-1 flex-col"
					>
						{isUnavailable ? (
							<ChatEmptyState
								title="This conversation isn't available"
								description="It may have been removed, or you don't have access to it."
							/>
						) : (
							<>
								<MessageList
									messages={messages}
									isLoading={messagesQuery.isPending}
									hasOlder={messagesQuery.hasNextPage}
									isLoadingOlder={messagesQuery.isFetchingNextPage}
									highlightedMessageId={threadMessageId}
									firstUnreadMessageId={firstUnreadMessageId}
									onLoadOlder={() => messagesQuery.fetchNextPage()}
									emptyState={
										channel?.kind === "direct_message" ? (
											<ChatEmptyState
												title={`Start a conversation with ${channel.name}`}
												description={
													channel.memberCount > 2
														? "Messages here are only visible to the people in this conversation."
														: "Messages here are only visible to the two of you."
												}
											/>
										) : (
											<ChatEmptyState
												title="No messages yet"
												description={`Be the first to post in ${channelName || "this channel"}.`}
											/>
										)
									}
									onOpenThread={(message) =>
										router.push(routes.chat.thread(channelId, message.id), {
											scroll: false,
										})
									}
									onQuote={setQuote}
									onMarkUnread={(message) =>
										markUnread.mutate(
											{ messageId: message.id },
											{ onSuccess: () => toast.success("Marked as unread") },
										)
									}
									onToggleReaction={(message, emoji) =>
										toggleReaction.mutate({ messageId: message.id, emoji })
									}
									onForward={setForwardingMessage}
									onDelete={setDeletingMessage}
								/>
								<div className="shrink-0 px-4 pt-2 pb-5 lg:px-6">
									<MessageComposer
										key={channelId}
										placeholder={`Message ${channelName}`.trim()}
										quotedMessage={quotedMessage}
										onCancelQuote={() => setQuote(null)}
										onSubmit={async ({ text, gif }) => {
											await sendMessage.mutateAsync({
												channelId,
												text,
												gif,
												quotedMessageId: quotedMessage?.id,
											});
											setQuote(null);
										}}
									/>
								</div>
							</>
						)}
					</section>
					{threadMessageId && (
						<ThreadPanel
							channelName={channelName}
							thread={threadQuery.data}
							isLoading={threadQuery.isPending}
							isUnavailable={threadQuery.isError && !threadQuery.data}
							isMobile={isMobile}
							onClose={() =>
								router.push(routes.chat.channel(channelId), { scroll: false })
							}
							onReply={({ text, gif, alsoSendToChannel }) =>
								replyInThread.mutateAsync({
									messageId: threadMessageId,
									text,
									gif,
									alsoSendToChannel,
								})
							}
							onToggleReaction={(message, emoji) =>
								toggleReaction.mutate({ messageId: message.id, emoji })
							}
							onForward={setForwardingMessage}
							onDelete={setDeletingMessage}
						/>
					)}
				</div>
			</SidebarInset>
			<ForwardDialog
				message={forwardingMessage}
				sourceChannelName={channelName}
				channels={channels}
				members={membersQuery.data?.data ?? []}
				isLoadingMembers={membersQuery.isPending}
				onClose={() => setForwardingMessage(null)}
				onForward={async ({ messageId, target, note }) => {
					const targetChannelId =
						"channelId" in target
							? target.channelId
							: (await startDm.mutateAsync({ userIds: [target.userId] }))
									.channelId;
					await forwardMessage.mutateAsync({
						messageId,
						targetChannelId,
						note: note || undefined,
					});
					setForwardingMessage(null);
					toast.success(`Forwarded to ${target.name}`);
					router.push(routes.chat.channel(targetChannelId));
				}}
			/>
			{channel?.kind === "direct_message" && (
				<PeoplePickerDialog
					open={isAddingPeople}
					onOpenChange={setIsAddingPeople}
					title="Add people"
					description="Choose people to add to this conversation"
					maxSelectable={MAX_DM_MEMBERS - channel.memberCount}
					excludeUserIds={channel.members.map((member) => member.id)}
					confirmLabel={(count) =>
						count === 1 ? "Add 1 person" : `Add ${count} people`
					}
					onConfirm={async (userIds) => {
						await addDmMembers.mutateAsync({
							channelId,
							userIds,
							shareHistory,
						});
						setIsAddingPeople(false);
						toast.success(
							userIds.length === 1
								? "Added 1 person"
								: `Added ${userIds.length} people`,
						);
					}}
				>
					<Label className="flex items-center gap-2 border-t px-3 py-2.5 text-sm font-normal">
						<Checkbox
							checked={shareHistory}
							onCheckedChange={(checked) => setShareHistory(checked === true)}
						/>
						Show them earlier messages
					</Label>
				</PeoplePickerDialog>
			)}
			<DeleteMessageDialog
				isOpen={!!deletingMessage}
				isDeleting={deleteMessage.isPending}
				onClose={() => setDeletingMessage(null)}
				onConfirm={() => {
					if (!deletingMessage) return;
					deleteMessage.mutate(
						{ messageId: deletingMessage.id },
						{
							onSuccess: () => {
								setDeletingMessage(null);
								toast.success("Message deleted");
							},
						},
					);
				}}
			/>
		</SidebarProvider>
	);
};

function getBreadcrumbs(channel: ChatChannel | undefined, isAdmin: boolean) {
	if (!channel) {
		return [{ label: "Chat" }];
	}
	if (channel.kind === "direct_message") {
		return [
			{ label: "Members", href: isAdmin ? routes.members.list() : undefined },
			{ label: channel.name },
		];
	}
	return [{ label: "Groups" }, { label: channel.name }];
}
