"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { channelNotificationScope } from "@/lib/notifications";

export const ChannelNotificationToggle = ({
	channelId,
	className,
}: {
	channelId: string;
	className?: string;
}) => {
	const { preferences, setPreference, isLoading } = useNotifications();
	const scope = channelNotificationScope(channelId);
	const isMuted = preferences[scope] === false;
	const label = isMuted
		? "Unmute notifications for this channel"
		: "Mute notifications for this channel";

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className={className}
						aria-label={label}
						aria-pressed={isMuted}
						disabled={isLoading}
						onClick={() => setPreference(scope, isMuted)}
					/>
				}
			>
				{isMuted ? <BellOff /> : <Bell />}
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
};
