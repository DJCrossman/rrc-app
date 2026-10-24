"use client";

import {
	IconBrandApple,
	IconBrandGoogle,
	IconBrandWindows,
	IconCopy,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CALENDAR_NAME = "Regina Rowing Club";

interface SubscribeDialogProps {
	isOpen: boolean;
	token: string | null;
	isResetting: boolean;
	canReply: boolean;
	onReset: () => void;
	onClose: () => void;
}

export const SubscribeDialog = ({
	isOpen,
	token,
	isResetting,
	canReply,
	onReset,
	onClose,
}: SubscribeDialogProps) => {
	const links = token ? getFeedLinks(token) : null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Subscribe to your calendar</DialogTitle>
					<DialogDescription>
						Training, regattas and volunteer shifts for your groups sync to your
						calendar app automatically.
						{canReply &&
							" Each event has links to reply with whether you're going."}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="calendar-feed-url">Calendar link</Label>
					<div className="flex gap-2">
						<Input
							id="calendar-feed-url"
							readOnly
							value={links?.webcal ?? "Creating your link…"}
							onFocus={(event) => event.target.select()}
							className="font-mono text-xs"
						/>
						<Button
							type="button"
							variant="outline"
							disabled={!links}
							onClick={async () => {
								if (!links) return;
								await navigator.clipboard.writeText(links.webcal);
								toast.success("Calendar link copied");
							}}
						>
							<IconCopy />
							Copy
						</Button>
					</div>
				</div>
				<div className="grid grid-cols-3 gap-2">
					<Button asChild variant="outline" disabled={!links}>
						<a href={links?.google} target="_blank" rel="noreferrer">
							<IconBrandGoogle />
							Google
						</a>
					</Button>
					<Button asChild variant="outline" disabled={!links}>
						<a href={links?.webcal}>
							<IconBrandApple />
							Apple
						</a>
					</Button>
					<Button asChild variant="outline" disabled={!links}>
						<a href={links?.outlook} target="_blank" rel="noreferrer">
							<IconBrandWindows />
							Outlook
						</a>
					</Button>
				</div>
				<DialogFooter className="sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						disabled={!token || isResetting}
						onClick={onReset}
					>
						Reset link
					</Button>
					<Button type="button" onClick={onClose}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

function getFeedLinks(token: string) {
	const path = `${window.location.host}/api/v1/calendar/${token}`;
	const webcal = `webcal://${path}`;
	const https = `${window.location.protocol}//${path}`;
	return {
		webcal,
		google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
		outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(CALENDAR_NAME)}`,
	};
}
