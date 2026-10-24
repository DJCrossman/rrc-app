"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

const SAMPLE_NOTIFICATIONS = [
	{
		title: "Masters · Mike Tran",
		body: "Wind's up — moving tomorrow to the erg room, 6:00.",
	},
	{
		title: "Schedule",
		body: "Head of the Wascana entries close today at 5 PM.",
	},
];

interface NotificationsStepProps {
	onContinue: () => void;
	onSkip: () => void;
	onBack?: () => void;
}

export function NotificationsStep({
	onContinue,
	onSkip,
	onBack,
}: NotificationsStepProps) {
	const notifications = useNotifications();
	const isOn =
		notifications.permission === "granted" && notifications.subscribed;
	const unavailableReason = notifications.isLoading
		? null
		: notifications.isError
			? "Notifications can't be turned on right now. You can turn them on later in Settings."
			: !notifications.supported
				? "This browser doesn't support notifications. You can turn them on later from another device."
				: !notifications.configured
					? "Notifications haven't been set up for the club yet. You can turn them on later in Settings."
					: notifications.permission === "denied"
						? "Notifications are blocked for this site. Allow them in your browser settings to turn them on."
						: null;

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h2 className="text-2xl font-semibold">Don't miss a launch</h2>
				<p className="text-muted-foreground">
					Practices get moved for wind. Turn on notifications to hear about
					changes, regatta updates and messages from your groups.
				</p>
			</div>

			<ul className="space-y-2" aria-label="Example notifications">
				{SAMPLE_NOTIFICATIONS.map((sample) => (
					<li
						key={sample.title}
						className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3"
					>
						<Image
							src="/logo.png"
							alt=""
							width={32}
							height={32}
							className="size-8 shrink-0 rounded-md"
						/>
						<div className="min-w-0 space-y-0.5">
							<p className="text-sm font-semibold">{sample.title}</p>
							<p className="text-sm text-muted-foreground">{sample.body}</p>
						</div>
					</li>
				))}
			</ul>

			{isOn ? (
				<p className="flex items-center gap-2 font-medium">
					<CheckCircle2 className="size-5 text-primary" />
					Notifications on
				</p>
			) : (
				unavailableReason && (
					<p className="text-sm text-muted-foreground">{unavailableReason}</p>
				)
			)}

			<div className="flex items-center justify-between gap-2">
				{onBack ? (
					<Button type="button" variant="ghost" onClick={onBack}>
						Back
					</Button>
				) : (
					<span />
				)}
				{isOn ? (
					<Button type="button" onClick={onContinue}>
						Continue
					</Button>
				) : (
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onSkip}>
							Not now
						</Button>
						<Button
							type="button"
							onClick={() => notifications.enable()}
							disabled={
								notifications.isLoading ||
								notifications.isPending ||
								unavailableReason !== null
							}
						>
							{notifications.isPending && <Loader2 className="animate-spin" />}
							Turn on notifications
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
