"use client";

import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
	ChatHeader,
	type ChatHeaderChannel,
} from "@/components/chat/chat-header";
import { type GroupTab, GroupTabs } from "@/components/group-tabs";
import { NotificationsBanner } from "@/components/notifications-banner";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import type { Group } from "@/lib/trpc/types";

interface GroupShellProps {
	group: Group;
	active: GroupTab;
	children: React.ReactNode;
}

export const GroupShell = ({ group, active, children }: GroupShellProps) => {
	const channel: ChatHeaderChannel = {
		id: group.channelId,
		kind: "group",
		name: group.name,
		memberCount: group.memberCount,
		members: [],
	};

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
				<SiteHeader
					breadcrumbs={[
						{ label: "Groups", href: routes.groups.list() },
						{ label: group.name },
					]}
				/>
				<ChatHeader channel={channel} backHref={routes.groups.list()}>
					<GroupTabs
						groupId={group.id}
						channelId={group.channelId}
						active={active}
					/>
				</ChatHeader>
				<NotificationsBanner className="mx-4 mt-3 w-auto lg:mx-6" />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
};
