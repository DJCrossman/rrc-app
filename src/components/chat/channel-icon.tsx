import {
	IconUser,
	IconUsers,
	IconUsersGroup,
	IconWorld,
} from "@tabler/icons-react";
import type { ChatChannel } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";

interface ChannelIconProps {
	channel: Pick<ChatChannel, "kind"> & { memberCount?: number };
	className?: string;
}

export function ChannelIcon({ channel, className }: ChannelIconProps) {
	const Icon =
		channel.kind === "everyone"
			? IconWorld
			: channel.kind === "group"
				? IconUsersGroup
				: (channel.memberCount ?? 2) > 2
					? IconUsers
					: IconUser;
	return <Icon className={cn("size-4 shrink-0", className)} />;
}
