"use client";

import {
	IconDashboard,
	IconFolder,
	IconSailboat2,
	IconTreadmill,
	IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { envVars } from "@/lib/env";
import { routes } from "@/lib/routes";

const data = {
	user: {
		name: "David",
		phone: "1 (306) 550 - 6678",
		avatar: "",
	},
	navMain: [
		{
			title: "Dashboard",
			url: routes.dashboard.home(),
			icon: IconDashboard,
		},
		{
			title: "Boats",
			url: routes.boats.list(),
			icon: IconSailboat2,
		},
		{
			title: "ERGs",
			url: routes.ergs.list(),
			icon: IconTreadmill,
		},
		{
			title: "Athletes",
			url: routes.athletes.list(),
			icon: IconUsers,
		},
		{
			title: "Training Plan",
			url: routes.workouts.list(),
			icon: IconFolder,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<a
								href={envVars.NEXT_PUBLIC_HOME_URL}
								className="flex items-center gap-2 font-medium"
							>
								<Image
									src="/logo.png"
									alt="Regina Rowing Club Logo"
									width={24}
									height={24}
								/>
								<span className="text-base font-semibold">
									Regina Rowing Club
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
