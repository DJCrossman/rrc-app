import { IconShare3 } from "@tabler/icons-react";
import { InitialsAvatar } from "@/components/chat/initials-avatar";
import type { ChatMessage } from "@/lib/trpc/types";
import { GifTile } from "../GifPicker/GifTile";

type ForwardedMessage = NonNullable<ChatMessage["forwarded"]>;

export function ForwardedBlock({ forwarded }: { forwarded: ForwardedMessage }) {
	return (
		<div className="flex max-w-[520px] flex-col gap-1.5 rounded-[10px] border border-input bg-white/[0.03] px-3 py-2.5">
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<IconShare3 className="size-3.5" />
				Forwarded from
				<span className="font-medium text-foreground">
					{forwarded.channelName}
				</span>
			</p>
			<div className="flex items-center gap-2">
				<InitialsAvatar
					initials={forwarded.author.initials}
					name={forwarded.author.name}
					size="xs"
				/>
				<span className="text-[13px] font-semibold">
					{forwarded.author.name}
				</span>
			</div>
			{forwarded.deleted ? (
				<p className="text-sm text-muted-foreground italic">
					Original message was deleted.
				</p>
			) : (
				<>
					{forwarded.text && (
						<p className="text-sm leading-normal break-words whitespace-pre-wrap">
							{forwarded.text}
						</p>
					)}
					{forwarded.gif && <GifTile label={forwarded.gif} variant="compact" />}
				</>
			)}
		</div>
	);
}
