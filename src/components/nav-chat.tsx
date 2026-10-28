"use client";

import {
	IconBellOff,
	IconPlus,
	IconUsers,
	IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChannelIcon } from "@/components/chat/channel-icon";
import { PeoplePickerDialog } from "@/components/chat/people-picker-dialog";
import { isActivePath } from "@/components/nav-main";
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { channelNotificationScope } from "@/lib/notifications";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { ChatChannels } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { MAX_DM_MEMBERS } from "@/schemas/chat.schema";

const CHANNELS_POLL_INTERVAL_MS = 20_000;

export function NavChat() {
	const pathname = usePathname();
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
	const channelsQuery = trpcClient.chat.getChannels.useQuery(undefined, {
		refetchInterval: CHANNELS_POLL_INTERVAL_MS,
	});
	const startDm = trpcClient.chat.startDm.useMutation({
		onError: (error) => toast.error(error.message),
	});
	const { preferences } = useNotifications();
	const { isAdmin } = useCurrentUser();
	const channels = (channelsQuery.data?.data ?? []).map((channel) => ({
		...channel,
		isMuted: preferences[channelNotificationScope(channel.id)] === false,
	}));

	return (
		<>
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					tooltip="Groups"
					isActive={pathname === routes.groups.list()}
				>
					<Link href={routes.groups.list()}>
						<IconUsersGroup />
						<span>Groups</span>
					</Link>
				</SidebarMenuButton>
				<ChannelSubMenu
					channels={channels.filter(
						(channel) => channel.kind !== "direct_message",
					)}
					pathname={pathname}
				/>
			</SidebarMenuItem>
			<SidebarMenuItem>
				{isAdmin ? (
					<SidebarMenuButton
						asChild
						tooltip="Members"
						isActive={isActivePath(pathname, routes.members.list())}
					>
						<Link href={routes.members.list()}>
							<IconUsers />
							<span>Members</span>
						</Link>
					</SidebarMenuButton>
				) : (
					<SidebarMenuButton tooltip="Members">
						<IconUsers />
						<span>Members</span>
					</SidebarMenuButton>
				)}
				<SidebarMenuAction
					showOnHover
					title="New message"
					onClick={() => setIsNewMessageOpen(true)}
				>
					<IconPlus />
					<span className="sr-only">New message</span>
				</SidebarMenuAction>
				<ChannelSubMenu
					channels={channels.filter(
						(channel) =>
							channel.kind === "direct_message" &&
							!channel.hasOnlyFormerMembers,
					)}
					pathname={pathname}
				/>
			</SidebarMenuItem>
			<PeoplePickerDialog
				open={isNewMessageOpen}
				onOpenChange={setIsNewMessageOpen}
				title="New message"
				description={`Choose up to ${MAX_DM_MEMBERS - 1} people to message`}
				maxSelectable={MAX_DM_MEMBERS - 1}
				confirmLabel={(count) =>
					count > 1 ? `Message ${count} people` : "Message"
				}
				onConfirm={async (userIds) => {
					const { channelId } = await startDm.mutateAsync({ userIds });
					await utils.chat.getChannels.invalidate();
					setIsNewMessageOpen(false);
					router.push(routes.chat.channel(channelId));
				}}
			/>
		</>
	);
}

function ChannelSubMenu({
	channels,
	pathname,
}: {
	channels: (ChatChannels[number] & { isMuted: boolean })[];
	pathname: string;
}) {
	if (channels.length === 0) {
		return null;
	}
	return (
		<SidebarMenuSub className="mr-0 gap-0.5 pr-0">
			{channels.map((channel) => {
				const chatHref = routes.chat.channel(channel.id);
				const href = channel.groupId
					? routes.groups.detail(channel.groupId)
					: chatHref;
				const isActive =
					pathname === chatHref ||
					pathname === href ||
					pathname.startsWith(`${href}/`);
				return (
					<SidebarMenuSubItem key={channel.id}>
						<SidebarMenuSubButton
							asChild
							isActive={isActive}
							className="[&>svg]:size-[15px] [&>svg]:text-muted-foreground"
						>
							<Link
								href={href}
								className={cn(channel.isMuted && !isActive && "opacity-60")}
							>
								{channel.kind === "direct_message" ? (
									<span className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-zinc-700 text-[9px] font-semibold">
										{channel.initials ?? <IconUsers className="size-3" />}
									</span>
								) : (
									<ChannelIcon channel={channel} />
								)}
								<span className="min-w-0 flex-1 truncate">{channel.name}</span>
								{channel.isMuted && (
									<IconBellOff
										aria-label="Muted"
										className="size-3.5 shrink-0 text-muted-foreground"
									/>
								)}
								{channel.unreadCount > 0 && !isActive && !channel.isMuted && (
									<span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground">
										{channel.unreadCount > 99 ? "99+" : channel.unreadCount}
									</span>
								)}
							</Link>
						</SidebarMenuSubButton>
					</SidebarMenuSubItem>
				);
			})}
		</SidebarMenuSub>
	);
}
