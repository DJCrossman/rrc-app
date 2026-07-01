import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface ListPageSkeletonProps {
	title: string;
	heading?: string;
	columns?: number;
	rows?: number;
}

export function ListPageSkeleton({
	title,
	heading = title,
	columns = 5,
	rows = 10,
}: ListPageSkeletonProps) {
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
				<SiteHeader breadcrumbs={[{ label: title }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">{heading}</Heading>
						</div>
						<div className="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
							<DataTableSkeleton columns={columns} rows={rows} />
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
