"use client";

import {
	IconActivity,
	IconCalendarEvent,
	IconHome,
	IconMenu2,
	IconMessageCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/components/nav-main";
import { useNotifications } from "@/hooks/useNotifications";
import { channelNotificationScope } from "@/lib/notifications";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
	const pathname = usePathname();
	const channelsQuery = trpcClient.chat.getChannels.useQuery();
	const { preferences } = useNotifications();
	const unreadCount = (channelsQuery.data?.data ?? [])
		.filter(
			(channel) =>
				!channel.hasOnlyFormerMembers &&
				preferences[channelNotificationScope(channel.id)] !== false,
		)
		.reduce((sum, channel) => sum + channel.unreadCount, 0);

	const tabs = [
		{ title: "Home", href: routes.dashboard.home(), icon: IconHome },
		{
			title: "Schedule",
			href: routes.schedule.list(),
			icon: IconCalendarEvent,
		},
		{
			title: "Chat",
			href: routes.chat.list(),
			icon: IconMessageCircle,
			activePaths: ["/chat"],
			badge: unreadCount,
		},
		{ title: "Activities", href: routes.activities.list(), icon: IconActivity },
		{
			title: "More",
			href: routes.more.home(),
			icon: IconMenu2,
			activePaths: MORE_PATHS,
		},
	];

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-0 bottom-(--mobile-nav-offset) z-20 grid h-(--mobile-nav-height) grid-cols-5 border-t bg-sidebar px-1.5 pt-1.5 pb-(--mobile-nav-inset) text-sidebar-foreground md:hidden"
		>
			{tabs.map(({ title, href, icon: Icon, activePaths, badge }) => {
				const isActive = (activePaths ?? [href]).some((path) =>
					isActivePath(pathname, path),
				);
				return (
					<Link
						key={title}
						href={href}
						aria-current={isActive ? "page" : undefined}
						aria-label={badge ? `${title}, ${badge} unread` : undefined}
						className={cn(
							"flex min-h-13 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-foreground",
							isActive && "text-blue-600 dark:text-blue-400",
						)}
					>
						<span
							className={cn(
								"relative flex h-[30px] w-[52px] items-center justify-center rounded-full",
								isActive && "bg-blue-500/10 dark:bg-blue-500/20",
							)}
						>
							<Icon className="size-[22px]" stroke={1.8} />
							{!!badge && (
								<span className="absolute top-0 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-primary px-1 text-[10px] font-bold text-sidebar-primary-foreground ring-2 ring-sidebar">
									{badge > 99 ? "99+" : badge}
								</span>
							)}
						</span>
						<span>{title}</span>
					</Link>
				);
			})}
		</nav>
	);
}

const MORE_PATHS = ["/more", "/boats", "/members", "/groups", "/settings"];
