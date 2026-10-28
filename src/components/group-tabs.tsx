import {
	IconCalendarEvent,
	IconLayoutDashboard,
	IconMessageCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type GroupTab = "overview" | "chat" | "schedule";

interface GroupTabsProps {
	groupId: string;
	channelId: string;
	active: GroupTab;
	/** Only the group's members (and admins) can open its chat. */
	canChat?: boolean;
}

export function GroupTabs({
	groupId,
	channelId,
	active,
	canChat = true,
}: GroupTabsProps) {
	const tabs = [
		{
			tab: "overview",
			label: "Overview",
			icon: IconLayoutDashboard,
			href: routes.groups.detail(groupId),
		},
		{
			tab: "chat",
			label: "Chat",
			icon: IconMessageCircle,
			href: routes.chat.channel(channelId),
		},
		{
			tab: "schedule",
			label: "Schedule",
			icon: IconCalendarEvent,
			href: routes.groups.schedule(groupId).list(),
		},
	] as const;

	return (
		<nav
			aria-label="Group sections"
			className="flex shrink-0 gap-0.5 rounded-lg bg-muted p-[3px]"
		>
			{tabs
				.filter(({ tab }) => canChat || tab !== "chat")
				.map(({ tab, label, icon: Icon, href }) => (
					<Link
						key={tab}
						href={href}
						aria-current={tab === active ? "page" : undefined}
						title={label}
						className={cn(
							"flex h-[26px] items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
							tab === active && "bg-background text-foreground shadow-xs",
						)}
					>
						<Icon className="size-3.5" />
						<span className="hidden sm:inline">{label}</span>
					</Link>
				))}
		</nav>
	);
}
