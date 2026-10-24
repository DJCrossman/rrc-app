"use client";

import { IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RsvpStatus } from "@/schemas";

interface VolunteerSignupProps {
	eventId: string;
	filled: number;
	spots: number;
	signedUp: boolean;
	canSignUp: boolean;
	onRsvp: (eventId: string, status: RsvpStatus) => Promise<RsvpStatus | null>;
}

export const VolunteerSignup = ({
	eventId,
	spots,
	canSignUp,
	onRsvp,
	...saved
}: VolunteerSignupProps) => {
	const [state, setState] = useState(saved);
	const [isPending, setIsPending] = useState(false);
	const isFull = state.filled >= spots && !state.signedUp;

	return (
		<div className="flex items-center gap-3">
			<span className="text-sm text-muted-foreground tabular-nums">
				{state.filled} / {spots} filled
			</span>
			{canSignUp && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-pressed={state.signedUp}
					disabled={isPending || isFull}
					className={cn(
						state.signedUp &&
							"border-intensity-600/60 bg-intensity-600/20 text-intensity-600 hover:bg-intensity-600/30 hover:text-intensity-600",
					)}
					onClick={async () => {
						const previous = state;
						setState({
							signedUp: !state.signedUp,
							filled: state.filled + (state.signedUp ? -1 : 1),
						});
						setIsPending(true);
						try {
							await onRsvp(eventId, "yes");
						} catch {
							setState(previous);
						} finally {
							setIsPending(false);
						}
					}}
				>
					{state.signedUp ? (
						<>
							Signed up <IconCheck />
						</>
					) : isFull ? (
						"Full"
					) : (
						"Sign up"
					)}
				</Button>
			)}
		</div>
	);
};
