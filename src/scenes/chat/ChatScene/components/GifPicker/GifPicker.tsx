"use client";

import { type ReactNode, useState } from "react";
import { useDrawerContentContainer } from "@/components/ui/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { PickerSearch } from "../PickerSearch/PickerSearch";
import { GifTile } from "./GifTile";

const GIF_PLACEHOLDERS = [
	"nailed it",
	"lets go",
	"cold water",
	"coffee time",
	"applause",
	"sleepy rower",
	"thumbs up",
	"victory",
	"windy day",
	"early alarm",
];

interface GifPickerProps {
	children: ReactNode;
	onSelect: (gif: string) => void;
}

export function GifPicker({ children, onSelect }: GifPickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const container = useDrawerContentContainer();
	const results = GIF_PLACEHOLDERS.filter((label) =>
		label.includes(query.trim().toLowerCase()),
	);

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) setQuery("");
			}}
		>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				container={container ?? undefined}
				align="start"
				className="flex w-[380px] flex-col gap-2 rounded-xl border-input bg-card p-2.5"
			>
				<PickerSearch
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search GIFs"
				/>
				<div className="grid max-h-[318px] grid-cols-2 gap-1.5 overflow-y-auto">
					{results.map((label) => (
						<button
							key={label}
							type="button"
							aria-label={`Send GIF: ${label}`}
							onClick={() => {
								onSelect(label);
								setOpen(false);
								setQuery("");
							}}
							className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<GifTile label={label} variant="picker" />
						</button>
					))}
				</div>
				{results.length === 0 && (
					<p className="py-6 text-center text-sm text-muted-foreground">
						No GIFs found
					</p>
				)}
				<p className="text-[11px] text-muted-foreground">
					GIF tiles are placeholders for a GIF provider
				</p>
			</PopoverContent>
		</Popover>
	);
}
