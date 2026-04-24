"use client";

import { useRouter } from "next/navigation";
import type { default as React } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Activities, Boat, Boats } from "@/lib/trpc/types";
import { BoatCreateDrawer, BoatDetailsDrawer, BoatTable } from "./components";

interface IProps {
	data: Boats;
	selectedBoat: Boat | null;
	activities?: Activities;
	isCreateDrawerOpen: boolean;
}

export const BoatListScene = ({
	data,
	selectedBoat,
	activities = [],
	isCreateDrawerOpen,
}: IProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const createBoat = trpcClient.boats.createBoat.useMutation({
		onSuccess: async () => {
			await utils.boats.getBoats.invalidate();
			router.push(routes.boats.list());
			router.refresh();
		},
	});
	const updateBoat = trpcClient.boats.updateBoat.useMutation({
		onSuccess: async () => {
			await utils.boats.getBoats.invalidate();
			await utils.boats.getBoatById.invalidate();
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
				<SiteHeader breadcrumbs={[{ label: "Boats" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">Boats</Heading>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<BoatTable data={data} />
						</div>
					</div>
				</div>
			</SidebarInset>
			<BoatCreateDrawer
				isOpen={isCreateDrawerOpen}
				onSubmit={async (data) => {
					await createBoat.mutateAsync(data);
				}}
				onClose={() => router.push(routes.boats.list())}
			/>
			<BoatDetailsDrawer
				isOpen={!!selectedBoat}
				boat={selectedBoat}
				activities={activities}
				onSubmit={async (data) => {
					await updateBoat.mutateAsync(data);
				}}
				onClose={() => router.push(routes.boats.list())}
			/>
		</SidebarProvider>
	);
};
