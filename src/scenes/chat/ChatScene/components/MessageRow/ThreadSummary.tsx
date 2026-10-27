import type { ChatMessage } from "@/lib/trpc/types";
import { formatLastReply } from "../../utils/messageFormatting";

interface ThreadSummaryProps {
	message: Pick<ChatMessage, "replyCount" | "lastReplyAt" | "replyAuthors">;
	onOpen: () => void;
}

export function ThreadSummary({ message, onOpen }: ThreadSummaryProps) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className="flex w-fit items-center gap-2 rounded-lg border border-transparent py-1 pr-2 pl-1 text-[13px] hover:border-white/10 hover:bg-white/[0.03]"
		>
			<span className="flex gap-0.5">
				{message.replyAuthors.map((author) => (
					<span
						key={author.id}
						title={author.name}
						className="flex size-5 items-center justify-center rounded-[5px] bg-zinc-700 text-[9px] font-semibold"
					>
						{author.initials}
					</span>
				))}
			</span>
			<span className="font-semibold text-blue-400">
				{message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
			</span>
			{message.lastReplyAt && (
				<span className="text-muted-foreground">
					Last reply {formatLastReply(message.lastReplyAt)}
				</span>
			)}
		</button>
	);
}
