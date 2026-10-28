import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const CARD_KEYS = ["next", "reply", "chat", "availability", "members"];

export const GroupSceneSkeleton = () => (
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
			<SiteHeader breadcrumbs={[{ label: "Groups" }]} />
			<div className="flex h-14 shrink-0 items-center gap-4 border-b px-4 lg:px-6">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-8 w-60" />
			</div>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-3 p-4 lg:px-6">
				{CARD_KEYS.map((key) => (
					<Skeleton key={key} className="h-40 rounded-xl" />
				))}
			</div>
		</SidebarInset>
	</SidebarProvider>
);
