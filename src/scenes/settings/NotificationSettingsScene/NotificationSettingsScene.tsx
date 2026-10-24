"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
	NOTIFICATION_SCOPE_ALL,
	NOTIFICATION_SCOPE_SCHEDULE,
} from "@/lib/notifications";
import { trpcClient } from "@/lib/trpc/client";

export const NotificationSettingsScene = () => {
	const { hasAthlete } = useCurrentUser();
	const notifications = useNotifications({ enabled: hasAthlete });
	const sendTest = trpcClient.notifications.sendTest.useMutation({
		onSuccess: (result) => {
			if (result.sent > 0) {
				toast.success("Test notification sent", {
					description: `Sent to ${result.sent} ${result.sent === 1 ? "device" : "devices"}.`,
				});
				return;
			}
			toast.error("No notification was delivered", {
				description:
					result.skipped > 0
						? "Notifications are turned off for your account."
						: "Try turning notifications off and on again.",
			});
		},
		onError: (error) => {
			toast.error("Couldn't send a test notification", {
				description: error.message,
			});
		},
	});

	if (!hasAthlete) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Notifications</CardTitle>
					<CardDescription>
						You're signed in as an admin and don't have a personal athlete
						profile, so there's nothing to notify you about yet.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const isOn =
		notifications.permission === "granted" &&
		notifications.subscribed &&
		notifications.isEnabled();
	const blocker = !notifications.supported
		? "This browser doesn't support push notifications."
		: !notifications.configured
			? "Push notifications haven't been configured on the server yet."
			: notifications.permission === "denied"
				? "Notifications are blocked for this site. Allow them in your browser settings, then try again."
				: null;
	const isBusy = notifications.isLoading || notifications.isPending;

	const onToggleAll = async (checked: boolean) => {
		if (checked) {
			await notifications.enable();
			return;
		}
		if (await notifications.disable()) {
			await notifications.setPreference(NOTIFICATION_SCOPE_ALL, false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Notifications</CardTitle>
				<CardDescription>
					Choose what the club sends to this device.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<PreferenceRow
					id="notifications-all"
					title="Push notifications"
					description="Practice changes, regatta updates and messages from your groups."
					checked={isOn}
					disabled={isBusy || (!isOn && blocker !== null)}
					onCheckedChange={onToggleAll}
				/>
				{blocker && !notifications.isLoading && (
					<p className="text-sm text-muted-foreground">{blocker}</p>
				)}
				<Separator />
				<PreferenceRow
					id="notifications-schedule"
					title="Schedule changes"
					description="Practices moved or cancelled, regatta updates and RSVP reminders."
					checked={isOn && notifications.isEnabled(NOTIFICATION_SCOPE_SCHEDULE)}
					disabled={!isOn || isBusy}
					onCheckedChange={(checked) =>
						notifications.setPreference(NOTIFICATION_SCOPE_SCHEDULE, checked)
					}
				/>
			</CardContent>
			<CardFooter className="flex-wrap justify-between gap-4">
				<p className="text-sm text-muted-foreground">
					Sends a notification to every device where you've turned them on.
				</p>
				<Button
					variant="outline"
					onClick={() => sendTest.mutate()}
					disabled={!isOn || sendTest.isPending}
				>
					{sendTest.isPending && <Loader2 className="animate-spin" />}
					Send test notification
				</Button>
			</CardFooter>
		</Card>
	);
};

function PreferenceRow({
	id,
	title,
	description,
	checked,
	disabled,
	onCheckedChange,
}: {
	id: string;
	title: string;
	description: string;
	checked: boolean;
	disabled: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-start justify-between gap-4">
			<div className="space-y-1">
				<Label htmlFor={id}>{title}</Label>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			<Switch
				id={id}
				checked={checked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	);
}
