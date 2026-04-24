"use client";

import { useRouter } from "next/navigation";
import type { default as React } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Activities, Erg, Ergs } from "@/lib/trpc/types";
import { ErgCreateDrawer, ErgDetailsDrawer, ErgTable } from "./components";

interface IProps {
	data: Ergs;
	selectedErg: Erg | null;
	activities?: Activities;
	isCreateDrawerOpen: boolean;
}

export const ErgListScene = ({
	data,
	selectedErg,
	activities = [],
	isCreateDrawerOpen,
}: IProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const createErg = trpcClient.ergs.createErg.useMutation({
		onSuccess: async () => {
			await utils.ergs.getErgs.invalidate();
			router.push(routes.ergs.list());
			router.refresh();
		},
	});
	const updateErg = trpcClient.ergs.updateErg.useMutation({
		onSuccess: async () => {
			await utils.ergs.getErgs.invalidate();
			await utils.ergs.getErgById.invalidate();
			router.refresh();
		},
	});

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
				onSubmit={async (data) => {
					await createErg.mutateAsync(data);
				}}
				onClose={() => router.push(routes.ergs.list())}
			/>
			<ErgDetailsDrawer
				isOpen={!!selectedErg}
				erg={selectedErg}
				activities={activities}
				onSubmit={async (data) => {
					await updateErg.mutateAsync(data);
				}}
				onClose={() => router.push(routes.ergs.list())}
			/>
		</SidebarProvider>
	);
};
