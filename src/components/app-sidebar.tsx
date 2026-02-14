"use client";

import {
	IconActivity,
	IconDashboard,
	IconFolder,
	// TODO: Re-enable Boats and ERGs navigation
	// IconSailboat2,
	// IconTreadmill,
	IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
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
import { useCurrentUser } from "@/hooks/useAuth";
import { envVars } from "@/lib/env";
import { routes } from "@/lib/routes";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useCurrentUser();
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:p-1.5!"
						>
							<Link
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
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain
					items={[
						{
							title: "Dashboard",
							url: routes.dashboard.home(),
							icon: IconDashboard,
						},
						// TODO: Re-enable Boats and ERGs navigation
						// {
						// 	title: "Boats",
						// 	url: routes.boats.list(),
						// 	icon: IconSailboat2,
						// },
						// {
						// 	title: "ERGs",
						// 	url: routes.ergs.list(),
						// 	icon: IconTreadmill,
						// },
						{
							title: "Athletes",
							url: routes.athletes.list(),
							icon: IconUsers,
						},
						{
							title: "Activities",
							url: routes.activities.list(),
							icon: IconActivity,
						},
						{
							title: "Training Plan",
							url: routes.workouts.list(),
							icon: IconFolder,
						},
					]}
				/>
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name:
							user.nickname ||
							[user.firstName, user.lastName.charAt(0)]
								.filter(Boolean)
								.join(" "),
						phone: user.phone || "",
						avatar: "",
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}
