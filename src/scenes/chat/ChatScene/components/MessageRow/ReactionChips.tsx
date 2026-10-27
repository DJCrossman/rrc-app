"use client";

import { IconMoodPlus } from "@tabler/icons-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatMessage } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { formatReactors } from "../../utils/messageFormatting";
import { EmojiPicker } from "../EmojiPicker/EmojiPicker";

interface ReactionChipsProps {
	reactions: ChatMessage["reactions"];
	onToggle: (emoji: string) => void;
}

export function ReactionChips({ reactions, onToggle }: ReactionChipsProps) {
	return (
		<div className="flex flex-wrap items-center gap-1">
			{reactions.map((reaction) => (
				<Tooltip key={reaction.emoji}>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-pressed={reaction.reactedByMe}
							aria-label={`${reaction.emoji} ${reaction.count}`}
							onClick={() => onToggle(reaction.emoji)}
							className={cn(
								"inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium transition-colors",
								reaction.reactedByMe
									? "border-sidebar-primary/80 bg-sidebar-primary/25"
									: "bg-card hover:bg-muted",
							)}
						>
							<span className="text-sm">{reaction.emoji}</span>
							<span className="tabular-nums">{reaction.count}</span>
						</button>
					</TooltipTrigger>
					<TooltipContent>
						{formatReactors(reaction.names)} reacted with {reaction.emoji}
					</TooltipContent>
				</Tooltip>
			))}
			<EmojiPicker onSelect={onToggle} align="start">
				<button
					type="button"
					aria-label="Add reaction"
					title="Add reaction"
					className="inline-flex h-6 w-[30px] items-center justify-center rounded-full border text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<IconMoodPlus className="size-3.5" />
				</button>
			</EmojiPicker>
		</div>
	);
}
