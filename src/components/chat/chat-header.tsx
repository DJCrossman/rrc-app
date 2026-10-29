import {
	IconChevronLeft,
	IconDoorExit,
	IconDotsVertical,
	IconUserPlus,
	IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
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
import { routes } from "@/lib/routes";
import type { ChatChannel } from "@/lib/trpc/types";
import { MAX_DM_MEMBERS } from "@/schemas/chat.schema";

const MIN_MEMBERS_TO_LEAVE = 3;

export type ChatHeaderChannel = Pick<
	ChatChannel,
	"id" | "kind" | "name" | "memberCount" | "members"
>;

interface ChatHeaderProps {
	channel: ChatHeaderChannel | undefined;
	/** Where the phone back chevron goes. */
	backHref?: string;
	children?: ReactNode;
	onAddPeople?: () => void;
	onLeave?: () => void;
}

export function ChatHeader({
	channel,
	backHref = routes.chat.list(),
	children,
	onAddPeople,
	onLeave,
}: ChatHeaderProps) {
	const isDm = channel?.kind === "direct_message";
	const memberLabel = channel
		? isDm
			? `${channel.memberCount} people`
			: `${channel.memberCount} ${channel.memberCount === 1 ? "member" : "members"}`
		: "";
	return (
		<div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
			<div className="flex min-w-0 items-center gap-4 max-md:gap-3">
				<Link
					href={backHref}
					aria-label="Back"
					className="-ml-2 flex size-9 shrink-0 items-center justify-center md:hidden"
				>
					<IconChevronLeft className="size-6" />
				</Link>
				{channel ? (
					<div className="flex min-w-0 items-center gap-2 text-base font-semibold max-md:gap-3">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 md:hidden dark:bg-blue-500/20 dark:text-blue-400">
							<ChannelIcon channel={channel} className="size-5" />
						</span>
						<ChannelIcon
							channel={channel}
							className="size-[18px] text-muted-foreground max-md:hidden"
						/>
						<div className="min-w-0">
							<h2 className="truncate">{channel.name}</h2>
							<p className="truncate text-[13px] font-normal text-muted-foreground md:hidden">
								{memberLabel}
							</p>
						</div>
					</div>
				) : (
					<Skeleton className="h-5 w-40" />
				)}
				{children}
			</div>
			{channel && (
				<div className="flex shrink-0 items-center gap-2">
					<span
						title={
							isDm
								? channel.members.map((member) => member.name).join(", ")
								: undefined
						}
						className="flex items-center gap-1.5 text-[13px] text-muted-foreground max-md:hidden"
					>
						<IconUsers className="size-3.5" />
						{memberLabel}
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
							<DropdownMenuTrigger
								render={
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 border border-input"
										aria-label="Conversation options"
									/>
								}
							>
								<IconDotsVertical />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem variant="destructive" onClick={onLeave}>
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
