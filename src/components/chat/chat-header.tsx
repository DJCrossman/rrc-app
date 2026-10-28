import {
	IconDoorExit,
	IconDotsVertical,
	IconUserPlus,
	IconUsers,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { ChannelNotificationToggle } from "@/components/channel-notification-toggle";
import { ChannelIcon } from "@/components/chat/channel-icon";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatChannel } from "@/lib/trpc/types";
import { MAX_DM_MEMBERS } from "@/schemas/chat.schema";

const MIN_MEMBERS_TO_LEAVE = 3;

interface ChatHeaderProps {
	channel: ChatChannel | undefined;
	tabs?: ReactNode;
	onAddPeople?: () => void;
	onLeave?: () => void;
}

export function ChatHeader({
	channel,
	tabs,
	onAddPeople,
	onLeave,
}: ChatHeaderProps) {
	const isDm = channel?.kind === "direct_message";
	return (
		<div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
			<div className="flex min-w-0 items-center gap-4">
				{channel ? (
					<div className="flex min-w-0 items-center gap-2 text-base font-semibold">
						<ChannelIcon
							channel={channel}
							className="size-[18px] text-muted-foreground"
						/>
						<h2 className="truncate">{channel.name}</h2>
					</div>
				) : (
					<Skeleton className="h-5 w-40" />
				)}
				{tabs}
			</div>
			{channel && (
				<div className="flex shrink-0 items-center gap-2">
					<span
						title={
							isDm
								? channel.members.map((member) => member.name).join(", ")
								: undefined
						}
						className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
					>
						<IconUsers className="size-3.5" />
						{isDm
							? `${channel.memberCount} people`
							: `${channel.memberCount} ${channel.memberCount === 1 ? "member" : "members"}`}
					</span>
					{isDm && channel.memberCount < MAX_DM_MEMBERS && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 border border-input"
							aria-label="Add people"
							title="Add people"
							onClick={onAddPeople}
						>
							<IconUserPlus />
						</Button>
					)}
					{isDm && channel.memberCount >= MIN_MEMBERS_TO_LEAVE && (
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-8 border border-input"
									aria-label="Conversation options"
								>
									<IconDotsVertical />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem variant="destructive" onSelect={onLeave}>
									<IconDoorExit />
									Leave conversation
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<ChannelNotificationToggle
						channelId={channel.id}
						className="size-8 border border-input"
					/>
				</div>
			)}
		</div>
	);
}
