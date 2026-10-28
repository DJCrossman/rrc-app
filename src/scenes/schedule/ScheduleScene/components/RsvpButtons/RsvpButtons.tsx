"use client";

import { IconCheck, IconHelp, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RsvpStatus } from "@/schemas";

const RSVP_OPTIONS = [
	{
		status: "yes",
		label: "Going",
		icon: IconCheck,
		selectedClassName:
			"border-intensity-600/60 bg-intensity-600/20 text-intensity-600 hover:bg-intensity-600/30 hover:text-intensity-600",
	},
	{
		status: "maybe",
		label: "Maybe",
		icon: IconHelp,
		selectedClassName:
			"border-intensity-400/60 bg-intensity-400/20 text-intensity-400 hover:bg-intensity-400/30 hover:text-intensity-400",
	},
	{
		status: "no",
		label: "Can't go",
		icon: IconX,
		selectedClassName:
			"border-intensity-100/60 bg-intensity-100/20 text-intensity-100 hover:bg-intensity-100/30 hover:text-intensity-100",
	},
] as const;

interface RsvpButtonsProps {
	eventId: string;
	status: RsvpStatus | null;
	showLabels?: boolean;
	onRsvp: (eventId: string, status: RsvpStatus) => Promise<RsvpStatus | null>;
}

export const RsvpButtons = ({
	eventId,
	status: savedStatus,
	showLabels = false,
	onRsvp,
}: RsvpButtonsProps) => {
	const [status, setStatus] = useState(savedStatus);
	const [isPending, setIsPending] = useState(false);

	return (
		<fieldset
			aria-label="RSVP"
			className={cn("flex gap-1", showLabels && "flex-wrap gap-1.5")}
		>
			{RSVP_OPTIONS.map(
				({ status: option, label, icon: Icon, selectedClassName }) => (
					<Button
						key={option}
						type="button"
						variant="outline"
						size={showLabels ? "sm" : "icon-sm"}
						aria-label={showLabels ? undefined : label}
						title={label}
						aria-pressed={status === option}
						disabled={isPending}
						className={cn(status === option && selectedClassName)}
						onClick={async () => {
							const previous = status;
							setStatus(option === status ? null : option);
							setIsPending(true);
							try {
								setStatus(await onRsvp(eventId, option));
							} catch {
								setStatus(previous);
							} finally {
								setIsPending(false);
							}
						}}
					>
						<Icon />
						{showLabels && label}
					</Button>
				),
			)}
		</fieldset>
	);
};
