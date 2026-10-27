import { IconArrowBackUp } from "@tabler/icons-react";
import type { ChatMessage } from "@/lib/trpc/types";

type QuotedMessage = NonNullable<ChatMessage["quoted"]>;

export function QuoteBlock({ quoted }: { quoted: QuotedMessage }) {
	const text = quoted.deleted
		? "Original message was deleted"
		: (quoted.text ??
			(quoted.gif ? `GIF: ${quoted.gif}` : "Forwarded message"));
	return (
		<div className="flex max-w-[520px] flex-col gap-0.5 rounded-lg border bg-card px-2.5 py-1.5 text-[13px] text-muted-foreground">
			<span className="flex items-center gap-1 font-medium text-zinc-300">
				<IconArrowBackUp className="size-3.5" />
				{quoted.author.name}
			</span>
			<span className="line-clamp-2">{text}</span>
		</div>
	);
}
