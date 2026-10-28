"use client";

import { type ReactElement, useState } from "react";
import { useDrawerContentContainer } from "@/components/ui/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PickerSearch } from "../PickerSearch/PickerSearch";
import { EMOJI_CATEGORIES, findEmoji, searchEmoji } from "./emojiData";
import { useFrequentEmoji } from "./useFrequentEmoji";

interface EmojiPickerProps {
	children: ReactElement;
	onSelect: (emoji: string) => void;
	onOpenChange?: (open: boolean) => void;
	align?: "start" | "center" | "end";
	restoreFocus?: boolean;
}

export function EmojiPicker({
	children,
	onSelect,
	onOpenChange,
	align = "end",
	restoreFocus = true,
}: EmojiPickerProps) {
	const [open, setOpen] = useState(false);
	const container = useDrawerContentContainer();

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				onOpenChange?.(next);
			}}
		>
			<PopoverTrigger render={children} />
			<PopoverContent
				container={container ?? undefined}
				align={align}
				className="w-[352px] rounded-xl border-input bg-card p-0"
				finalFocus={restoreFocus}
			>
				<EmojiPickerContent
					onSelect={(emoji) => {
						onSelect(emoji);
						setOpen(false);
						onOpenChange?.(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

function EmojiPickerContent({
	onSelect,
}: {
	onSelect: (emoji: string) => void;
}) {
	const [query, setQuery] = useState("");
	const { frequent, recordUse } = useFrequentEmoji();
	const categories = [
		{
			id: "frequent",
			label: "Frequently used",
			icon: "🕘",
			emojis: frequent.map(findEmoji),
		},
		...EMOJI_CATEGORIES,
	];
	const [categoryId, setCategoryId] = useState(categories[0].id);
	const isSearching = query.trim().length > 0;
	const category =
		categories.find((item) => item.id === categoryId) ?? categories[0];
	const emojis = isSearching ? searchEmoji(query) : category.emojis;

	return (
		<div>
			<div className="px-2.5 pt-2.5 pb-1.5">
				<PickerSearch
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search all emoji"
				/>
			</div>
			<div className="flex gap-0.5 border-b px-1.5">
				{categories.map((item) => {
					const isActive = !isSearching && item.id === category.id;
					return (
						<button
							key={item.id}
							type="button"
							title={item.label}
							aria-label={item.label}
							aria-pressed={isActive}
							onClick={() => {
								setCategoryId(item.id);
								setQuery("");
							}}
							className={cn(
								"flex h-8 flex-1 items-center justify-center border-b-2 text-base",
								isActive
									? "border-zinc-200 opacity-100"
									: "border-transparent opacity-[0.55] hover:opacity-100",
							)}
						>
							{item.icon}
						</button>
					);
				})}
			</div>
			<p className="px-2.5 pt-2 pb-0.5 text-xs font-medium text-muted-foreground">
				{isSearching ? "Search results" : category.label}
			</p>
			<div className="grid h-60 grid-cols-9 content-start overflow-y-auto px-1.5 pb-2">
				{emojis.map((emoji) => (
					<button
						key={emoji.char}
						type="button"
						title={emoji.name}
						aria-label={emoji.name}
						onClick={() => {
							recordUse(emoji.char);
							onSelect(emoji.char);
						}}
						className="flex h-9 items-center justify-center rounded-md text-[22px] leading-none hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
					>
						{emoji.char}
					</button>
				))}
				{isSearching && emojis.length === 0 && (
					<p className="col-span-9 py-8 text-center text-sm text-muted-foreground">
						No emoji found
					</p>
				)}
			</div>
		</div>
	);
}
