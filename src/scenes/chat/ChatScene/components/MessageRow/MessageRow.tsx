"use client";

import { InitialsAvatar } from "@/components/chat/initials-avatar";
import type { ChatMessage } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "../../utils/messageFormatting";
import { GifTile } from "../GifPicker/GifTile";
import { ForwardedBlock } from "./ForwardedBlock";
import { LinkifiedText } from "./LinkifiedText";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { type MessageActionHandlers, MessageActions } from "./MessageActions";
import { QuoteBlock } from "./QuoteBlock";
import { ReactionChips } from "./ReactionChips";
import { ThreadSummary } from "./ThreadSummary";

interface MessageRowProps extends MessageActionHandlers {
	message: ChatMessage;
	showThreadSummary?: boolean;
	compact?: boolean;
	isHighlighted?: boolean;
}

export function MessageRow({
	message,
	showThreadSummary = true,
	compact = false,
	isHighlighted = false,
	...handlers
}: MessageRowProps) {
	const { author } = message;
	return (
		<article
			tabIndex={-1}
			data-compact={compact}
			aria-label={`${author.name}, ${formatMessageTime(message.createdAt)}`}
			className={cn(
				"group relative flex py-2 outline-none focus-within:bg-white/[0.02] hover:bg-white/[0.02]",
				compact ? "gap-2.5 px-4" : "gap-3 px-4 lg:px-6",
				isHighlighted && "bg-white/[0.04]",
			)}
		>
			<InitialsAvatar
				initials={author.initials}
				name={author.name}
				size={compact ? "sm" : "md"}
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex flex-wrap items-baseline gap-x-2">
					<span className="text-sm font-semibold">{author.name}</span>
					<time
						dateTime={message.createdAt}
						className="text-xs text-muted-foreground"
					>
						{formatMessageTime(message.createdAt)}
					</time>
					{author.isCoach && (
						<span className="rounded-[4px] border border-white/15 px-1.5 text-[11px] text-muted-foreground">
							Coach
						</span>
					)}
				</div>
				{message.quoted && <QuoteBlock quoted={message.quoted} />}
				{message.deleted ? (
					<p className="text-sm text-muted-foreground italic">
						This message was deleted.
					</p>
				) : (
					message.text && (
						<p className="max-w-[720px] text-sm leading-normal break-words whitespace-pre-wrap">
							<LinkifiedText text={message.text} />
						</p>
					)
				)}
				{message.previews.map((preview) => (
					<LinkPreviewCard
						key={`${preview.kind}:${preview.id}`}
						preview={preview}
					/>
				))}
				{message.forwarded && <ForwardedBlock forwarded={message.forwarded} />}
				{message.gif && (
					<GifTile
						label={message.gif}
						variant={compact ? "compact" : "message"}
					/>
				)}
				{message.reactions.length > 0 && (
					<ReactionChips
						reactions={message.reactions}
						onToggle={handlers.onToggleReaction}
					/>
				)}
				{showThreadSummary &&
					message.replyCount > 0 &&
					handlers.onOpenThread && (
						<ThreadSummary message={message} onOpen={handlers.onOpenThread} />
					)}
			</div>
			{!message.deleted && <MessageActions message={message} {...handlers} />}
		</article>
	);
}
