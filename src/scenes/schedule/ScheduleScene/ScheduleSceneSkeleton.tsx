import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const ScheduleSceneSkeleton = () => (
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
			<div className="flex flex-1 flex-col gap-2">
				<div className="flex items-center justify-between p-4 lg:px-6">
					<Heading as="h1">Schedule</Heading>
				</div>
				<div className="flex flex-col gap-3 px-4 lg:px-6">
					<Skeleton className="h-8 w-72" />
					<Skeleton className="h-7 w-56" />
				</div>
				<div className="flex flex-col px-4 pb-6 lg:px-6">
					{DAY_KEYS.map((key) => (
						<div key={key} className="flex gap-4 border-b py-4">
							<Skeleton className="hidden size-12 shrink-0 md:block" />
							<Skeleton className="h-16 flex-1" />
						</div>
					))}
				</div>
			</div>
		</SidebarInset>
	</SidebarProvider>
);
