"use client";

import {
	IconCopy,
	IconDotsVertical,
	IconMail,
	IconMessageReply,
	IconMoodPlus,
	IconQuote,
	IconShare3,
	IconTrash,
} from "@tabler/icons-react";
import { type ComponentProps, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "../EmojiPicker/EmojiPicker";

const QUICK_REACTIONS = ["✅", "👀", "🙌"];

export interface MessageActionHandlers {
	onToggleReaction: (emoji: string) => void;
	onOpenThread?: () => void;
	onQuote?: () => void;
	onMarkUnread?: () => void;
	onForward: () => void;
	onDelete: () => void;
}

interface MessageActionsProps extends MessageActionHandlers {
	message: ChatMessage;
}

export function MessageActions({
	message,
	onToggleReaction,
	onOpenThread,
	onQuote,
	onMarkUnread,
	onForward,
	onDelete,
}: MessageActionsProps) {
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const restoreFocus = useRef(true);
	const hasMenuItems =
		!!onQuote || !!onMarkUnread || !!message.text || message.canDelete;

	const selectWithoutRestoringFocus = (action: () => void) => () => {
		restoreFocus.current = false;
		action();
	};

	return (
		<div
			data-open={isPickerOpen || isMenuOpen}
			className="pointer-events-none absolute -top-3.5 right-4 z-10 flex items-center gap-0.5 rounded-lg border border-input bg-card p-[3px] opacity-0 shadow-sm transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 data-[open=true]:pointer-events-auto data-[open=true]:opacity-100 lg:right-6 lg:group-data-[compact=true]:right-4"
		>
			{QUICK_REACTIONS.map((emoji) => (
				<ActionButton
					key={emoji}
					label={`React with ${emoji}`}
					onClick={() => onToggleReaction(emoji)}
					className="text-base"
				>
					{emoji}
				</ActionButton>
			))}
			<span className="mx-0.5 h-[18px] w-px bg-white/10" />
			<EmojiPicker onSelect={onToggleReaction} onOpenChange={setIsPickerOpen}>
				<ActionButton label="Add reaction">
					<IconMoodPlus />
				</ActionButton>
			</EmojiPicker>
			{onOpenThread && (
				<ActionButton label="Reply in thread" onClick={onOpenThread}>
					<IconMessageReply />
				</ActionButton>
			)}
			<ActionButton label="Forward" onClick={onForward}>
				<IconShare3 />
			</ActionButton>
			{hasMenuItems && (
				<DropdownMenu modal={false} onOpenChange={setIsMenuOpen}>
					<DropdownMenuTrigger asChild>
						<ActionButton label="More actions">
							<IconDotsVertical />
						</ActionButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						onCloseAutoFocus={(event) => {
							if (!restoreFocus.current) event.preventDefault();
							restoreFocus.current = true;
						}}
					>
						{onQuote && (
							<DropdownMenuItem onSelect={selectWithoutRestoringFocus(onQuote)}>
								<IconQuote />
								Quote
							</DropdownMenuItem>
						)}
						{message.text && (
							<DropdownMenuItem
								onSelect={async () => {
									await navigator.clipboard.writeText(message.text ?? "");
									toast.success("Copied to clipboard");
								}}
							>
								<IconCopy />
								Copy text
							</DropdownMenuItem>
						)}
						{onMarkUnread && (
							<DropdownMenuItem onSelect={onMarkUnread}>
								<IconMail />
								Mark unread
							</DropdownMenuItem>
						)}
						{message.canDelete && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									variant="destructive"
									onSelect={selectWithoutRestoringFocus(onDelete)}
								>
									<IconTrash />
									Delete message
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}

function ActionButton({
	label,
	className,
	...props
}: ComponentProps<typeof Button> & { label: string }) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			aria-label={label}
			title={label}
			className={cn("h-7 w-[30px] rounded-md [&_svg]:size-[17px]", className)}
			{...props}
		/>
	);
}
