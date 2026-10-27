"use client";

import { IconCheck, IconX } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { trpcClient } from "@/lib/trpc/client";
import type { ChatMembers } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "./initials-avatar";

interface PeoplePickerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	maxSelectable: number;
	excludeUserIds?: string[];
	confirmLabel: (count: number) => string;
	onConfirm: (userIds: string[]) => Promise<unknown>;
	children?: ReactNode;
}

export function PeoplePickerDialog({
	open,
	onOpenChange,
	title,
	description,
	...props
}: PeoplePickerDialogProps) {
	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			description={description}
		>
			{open && <PeoplePicker {...props} />}
		</CommandDialog>
	);
}

function PeoplePicker({
	maxSelectable,
	excludeUserIds = [],
	confirmLabel,
	onConfirm,
	children,
}: Omit<
	PeoplePickerDialogProps,
	"open" | "onOpenChange" | "title" | "description"
>) {
	const [selected, setSelected] = useState<ChatMembers>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const membersQuery = trpcClient.chat.getMembers.useQuery();
	const people = (membersQuery.data?.data ?? []).filter(
		(person) => !excludeUserIds.includes(person.id),
	);
	const isFull = selected.length >= maxSelectable;

	return (
		<>
			{selected.length > 0 && (
				<div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
					{selected.map((person) => (
						<button
							key={person.id}
							type="button"
							aria-label={`Remove ${person.name}`}
							onClick={() =>
								setSelected((current) =>
									current.filter((item) => item.id !== person.id),
								)
							}
							className="flex items-center gap-1.5 rounded-md bg-muted py-0.5 pr-1.5 pl-0.5 text-xs hover:bg-accent"
						>
							<InitialsAvatar initials={person.initials} size="xs" />
							{person.name}
							<IconX className="size-3 text-muted-foreground" />
						</button>
					))}
				</div>
			)}
			<CommandInput placeholder="Search members…" />
			<CommandList>
				<CommandEmpty>
					{membersQuery.isPending ? "Loading members…" : "No members found."}
				</CommandEmpty>
				<CommandGroup heading="Members">
					{people.map((person) => {
						const isSelected = selected.some((item) => item.id === person.id);
						return (
							<CommandItem
								key={person.id}
								value={`${person.name} ${person.id}`}
								disabled={!isSelected && isFull}
								onSelect={() =>
									setSelected((current) =>
										isSelected
											? current.filter((item) => item.id !== person.id)
											: [...current, person],
									)
								}
							>
								<InitialsAvatar initials={person.initials} size="sm" />
								<span className="flex-1">{person.name}</span>
								<IconCheck
									className={cn("size-4", !isSelected && "invisible")}
								/>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
			{children}
			<div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
				<span className="text-xs text-muted-foreground">
					{isFull
						? `That's the most you can add (${maxSelectable})`
						: `${selected.length} selected`}
				</span>
				<Button
					size="sm"
					disabled={selected.length === 0 || isSubmitting}
					onClick={() => {
						setIsSubmitting(true);
						onConfirm(selected.map((person) => person.id))
							.catch(() => undefined)
							.finally(() => setIsSubmitting(false));
					}}
				>
					{confirmLabel(selected.length)}
				</Button>
			</div>
		</>
	);
}
