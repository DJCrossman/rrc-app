"use client";

import { IconPencil, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { ChannelIcon } from "@/components/chat/channel-icon";
import { InitialsAvatar } from "@/components/chat/initials-avatar";
import { PeoplePickerDialog } from "@/components/chat/people-picker-dialog";
import { MobilePageHeader } from "@/components/mobile-page-header";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { MOBILE_BREAKPOINT } from "@/hooks/useIsMobile";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { ChatChannel } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { CountBadge } from "@/scenes/dashboard/DashboardScene/components/ClubWeek/ClubWeekCard";
import { EVERYONE_CHANNEL_ID, MAX_DM_MEMBERS } from "@/schemas/chat.schema";
import { formatLastReply } from "../ChatScene/utils/messageFormatting";

const CHANNELS_POLL_INTERVAL_MS = 20_000;

export const ChatListScene = () => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const [search, setSearch] = useState("");
	const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
	const channelsQuery = trpcClient.chat.getChannels.useQuery(undefined, {
		refetchInterval: CHANNELS_POLL_INTERVAL_MS,
	});
	const startDm = trpcClient.chat.startDm.useMutation({
		onError: (error) => toast.error(error.message),
	});

	// The page only exists for the mobile tab bar; wider screens use the sidebar channel list.
	useEffect(() => {
		const query = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
		const redirect = () => {
			if (query.matches) router.replace(routes.chat.everyone());
		};
		redirect();
		query.addEventListener("change", redirect);
		return () => query.removeEventListener("change", redirect);
	}, [router]);

	const channels = channelsQuery.data?.data;
	const matches = (channel: ChatChannel) =>
		channel.name.toLowerCase().includes(search.trim().toLowerCase());
	const groups = channels
		?.filter((channel) => channel.kind !== "direct_message" && matches(channel))
		.sort(
			(a, b) =>
				Number(b.id === EVERYONE_CHANNEL_ID) -
					Number(a.id === EVERYONE_CHANNEL_ID) || byUnreadThenRecent(a, b),
		);
	const members = channels
		?.filter(
			(channel) =>
				channel.kind === "direct_message" &&
				!channel.hasOnlyFormerMembers &&
				matches(channel),
		)
		.sort(byUnreadThenRecent);

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader breadcrumbs={[{ label: "Chat" }]} />
				<MobilePageHeader
					title="Chat"
					className="pb-4"
					actions={
						<Button
							size="icon-lg"
							className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
							aria-label="New message"
							onClick={() => setIsNewMessageOpen(true)}
						>
							<IconPencil className="size-5" />
						</Button>
					}
				>
					<div className="relative">
						<IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							aria-label="Search conversations"
							placeholder="Search conversations"
							className="h-11 rounded-xl border-0 bg-muted pl-11 text-base shadow-none dark:bg-muted"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
				</MobilePageHeader>
				<div className="flex flex-col md:hidden">
					{channels ? (
						<>
							<ChannelSection title="Groups" channels={groups ?? []} />
							<ChannelSection title="Members" channels={members ?? []} />
						</>
					) : (
						<ChannelListSkeleton />
					)}
				</div>
			</SidebarInset>
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
		</SidebarProvider>
	);
};

const byUnreadThenRecent = (a: ChatChannel, b: ChatChannel) =>
	Number(b.unreadCount > 0) - Number(a.unreadCount > 0) ||
	b.lastActivityAt.localeCompare(a.lastActivityAt);

const ChannelSection = ({
	title,
	channels,
}: {
	title: string;
	channels: ChatChannel[];
}) => {
	if (channels.length === 0) return null;
	return (
		<section className="flex flex-col">
			<h2 className="border-y bg-muted/40 px-4 pt-4 pb-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
				{title}
			</h2>
			<ul className="divide-y">
				{channels.map((channel) => (
					<li key={channel.id}>
						<ChannelRow channel={channel} />
					</li>
				))}
			</ul>
		</section>
	);
};

const ChannelRow = ({ channel }: { channel: ChatChannel }) => {
	const isUnread = channel.unreadCount > 0;
	return (
		<Link
			href={routes.chat.channel(channel.id)}
			className="flex items-center gap-3.5 px-4 py-3 hover:bg-muted/50"
		>
			{channel.kind === "direct_message" ? (
				<InitialsAvatar
					initials={channel.initials ?? "?"}
					className="size-11 rounded-full text-[15px] font-semibold"
				/>
			) : (
				<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
					<ChannelIcon channel={channel} className="size-5" />
				</span>
			)}
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="flex items-baseline justify-between gap-3">
					<span
						className={cn(
							"truncate text-[17px]",
							isUnread ? "font-bold" : "font-semibold",
						)}
					>
						{channel.name}
					</span>
					{channel.lastMessage && (
						<span
							className={cn(
								"shrink-0 text-[13px] whitespace-nowrap",
								isUnread
									? "font-medium text-foreground"
									: "text-muted-foreground",
							)}
						>
							{formatLastReply(channel.lastMessage.createdAt)}
						</span>
					)}
				</span>
				<span className="flex items-center gap-3">
					<span
						className={cn(
							"min-w-0 flex-1 truncate text-[15px]",
							isUnread ? "text-foreground/80" : "text-muted-foreground",
						)}
					>
						{channel.lastMessage
							? `${channel.lastMessage.isMine ? "You" : channel.lastMessage.authorName.split(" ")[0]}: ${channel.lastMessage.preview}`
							: "No messages yet"}
					</span>
					{isUnread && <CountBadge count={channel.unreadCount} />}
				</span>
			</span>
		</Link>
	);
};

const ChannelListSkeleton = () => (
	<ul className="divide-y border-t">
		{Array.from({ length: 6 }, (_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
			<li key={index} className="flex items-center gap-3.5 px-4 py-3">
				<Skeleton className="size-11 rounded-xl" />
				<span className="flex flex-1 flex-col gap-2">
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-3.5 w-2/3" />
				</span>
			</li>
		))}
	</ul>
);
