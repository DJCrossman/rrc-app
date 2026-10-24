"use client";

import { IconBell } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatEventDate } from "@/lib/schedule/event-labels";
import type { ScheduleEvent } from "@/lib/trpc/types";

interface NudgeDialogProps {
	event: ScheduleEvent | null;
	onClose: () => void;
	onConfirm: (eventId: string) => Promise<void>;
}

export const NudgeDialog = ({
	event,
	onClose,
	onConfirm,
}: NudgeDialogProps) => {
	const [isSending, setIsSending] = useState(false);

	if (!event) {
		return null;
	}

	const count = event.counts.noReply;
	const people = `${count} ${count === 1 ? "person" : "people"}`;

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Nudge athletes</DialogTitle>
					<DialogDescription>
						{count === 0
							? `Everyone has replied to ${event.title}.`
							: `This will send a notification to ${people} who haven't ${event.volunteer ? "signed up for" : "replied to"} ${event.title} on ${formatEventDate(event.startAt, event.timezone)}.`}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={count === 0 || isSending}
						onClick={async () => {
							setIsSending(true);
							try {
								await onConfirm(event.id);
								onClose();
							} finally {
								setIsSending(false);
							}
						}}
					>
						<IconBell />
						Send to {people}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
