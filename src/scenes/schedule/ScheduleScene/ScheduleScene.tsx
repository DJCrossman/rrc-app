"use client";

import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import type { Groups } from "@/lib/trpc/types";
import { ScheduleView, type ScheduleViewProps } from "./ScheduleView";

interface ScheduleSceneProps extends ScheduleViewProps {
	groups: Groups;
}

export const ScheduleScene = ({ groups, ...props }: ScheduleSceneProps) => (
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
			<SiteHeader breadcrumbs={[{ label: "Schedule" }]} />
			<ScheduleView
				{...props}
				title={<Heading as="h1">Schedule</Heading>}
				scheduleRoutes={routes.schedule}
				groups={groups}
			/>
		</SidebarInset>
	</SidebarProvider>
);
