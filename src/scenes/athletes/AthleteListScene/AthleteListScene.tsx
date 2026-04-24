"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Activities, Athlete, Athletes } from "@/lib/trpc/types";
import type { AthleteStats } from "@/schemas/athlete.schema";
import {
	AthleteCreateDrawer,
	AthleteDetailsDrawer,
	AthleteTable,
} from "./components";

interface IProps {
	data: Athletes;
	selectedAthlete: Athlete | null;
	activities?: Activities;
	athleteStats: AthleteStats | null;
	isCreateDrawerOpen: boolean;
}

export const AthleteListScene = ({
	data,
	selectedAthlete,
	activities = [],
	athleteStats,
	isCreateDrawerOpen,
}: IProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const createAthlete = trpcClient.athletes.createAthlete.useMutation({
		onSuccess: async () => {
			await utils.athletes.getAthletes.invalidate();
			router.push(routes.athletes.list());
			router.refresh();
		},
	});
	const updateAthlete = trpcClient.athletes.updateAthlete.useMutation({
		onSuccess: async () => {
			await utils.athletes.getAthletes.invalidate();
			await utils.athletes.getAthleteById.invalidate();
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
				<SiteHeader breadcrumbs={[{ label: "Athletes" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">Athletes</Heading>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<AthleteTable data={data} />
						</div>
					</div>
				</div>
			</SidebarInset>
			<AthleteCreateDrawer
				isOpen={isCreateDrawerOpen}
				onSubmit={async (data) => {
					await createAthlete.mutateAsync(data);
				}}
				onClose={() => router.push(routes.athletes.list())}
			/>
			<AthleteDetailsDrawer
				isOpen={!!selectedAthlete}
				athlete={selectedAthlete}
				activities={activities}
				athleteStats={athleteStats}
				onSubmit={async (data) => {
					await updateAthlete.mutateAsync(data);
				}}
				onClose={() => router.push(routes.athletes.list())}
			/>
		</SidebarProvider>
	);
};
