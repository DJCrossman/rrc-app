import Link from "next/link";
import { ChannelIcon } from "@/components/chat/channel-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import type { ChatChannels } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { formatLastReply } from "@/scenes/chat/ChatScene/utils/messageFormatting";
import { ClubWeekCard, CountBadge } from "./ClubWeekCard";

const MAX_CHANNELS = 4;

interface MessagesCardProps {
	channels: ChatChannels | undefined;
}

export const MessagesCard = ({ channels }: MessagesCardProps) => {
	const shown = [...(channels ?? [])]
		.sort(
			(a, b) =>
				b.unreadCount - a.unreadCount ||
				b.lastActivityAt.localeCompare(a.lastActivityAt),
		)
		.slice(0, MAX_CHANNELS);
	return (
		<ClubWeekCard title="Messages" className="gap-1">
			{!channels ? (
				<Skeleton className="h-24 w-full" />
			) : shown.length === 0 ? (
				<p className="text-[13px] text-muted-foreground">No messages yet.</p>
			) : (
				<ul className="flex flex-col">
					{shown.map((channel) => (
						<li key={channel.id}>
							<Link
								href={routes.chat.channel(channel.id)}
								className="-mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-muted"
							>
								<span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-muted text-[11px] font-semibold">
									{channel.initials ?? <ChannelIcon channel={channel} />}
								</span>
								<span className="flex min-w-0 flex-1 flex-col gap-0.5">
									<span className="flex items-baseline justify-between gap-2">
										<span
											className={cn(
												"truncate text-[13px]",
												channel.unreadCount ? "font-semibold" : "font-medium",
											)}
										>
											{channel.name}
										</span>
										{channel.lastMessage && (
											<span className="text-xs whitespace-nowrap text-muted-foreground">
												{formatLastReply(channel.lastMessage.createdAt)}
											</span>
										)}
									</span>
									<span className="flex items-center gap-2">
										<span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
											{channel.lastMessage
												? `${channel.lastMessage.isMine ? "You" : channel.lastMessage.authorName.split(" ")[0]}: ${channel.lastMessage.preview}`
												: "No messages yet"}
										</span>
										{channel.unreadCount > 0 && (
											<CountBadge count={channel.unreadCount} />
										)}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</ClubWeekCard>
	);
};
