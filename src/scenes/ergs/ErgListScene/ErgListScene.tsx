"use client";

import type { default as React } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useNavigate } from "@/hooks/useNavigate";
import { routes } from "@/lib/routes";
import type { Activities, CreateErg, Erg, Ergs } from "@/schemas";
import { ErgCreateDrawer, ErgDetailsDrawer, ErgTable } from "./components";

interface IProps {
	data: Ergs;
	selectedErg: Erg | null;
	activities?: Activities;
	isCreateDrawerOpen: boolean;
	onCreateErg: (data: CreateErg) => Promise<void> | void;
	onUpdateErg: (data: Erg) => Promise<void> | void;
}

export const ErgListScene = ({
	data,
	selectedErg,
	activities = [],
	isCreateDrawerOpen,
	onCreateErg,
	onUpdateErg,
}: IProps) => {
	const router = useNavigate();

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
				<SiteHeader breadcrumbs={[{ label: "ERGs" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">ERGs</Heading>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<ErgTable data={data} />
						</div>
					</div>
				</div>
			</SidebarInset>
			<ErgCreateDrawer
				isOpen={isCreateDrawerOpen}
				onSubmit={onCreateErg}
				onClose={() => router.push(routes.ergs.list())}
			/>
			<ErgDetailsDrawer
				isOpen={!!selectedErg}
				erg={selectedErg}
				activities={activities}
				onSubmit={onUpdateErg}
				onClose={() => router.push(routes.ergs.list())}
			/>
		</SidebarProvider>
	);
};
