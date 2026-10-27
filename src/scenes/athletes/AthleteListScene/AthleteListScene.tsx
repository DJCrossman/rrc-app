"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BulkUploadDrawer } from "@/components/bulk-upload-drawer";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Activities, Athlete, MembersResult } from "@/lib/trpc/types";
import { type CreateAthlete, createAthleteSchema } from "@/schemas";
import type { AthleteStats } from "@/schemas/athlete.schema";
import {
	AthleteCreateDrawer,
	AthleteDetailsDrawer,
	MemberTable,
} from "./components";
import { useAthleteBulkColumns } from "./components/useAthleteBulkColumns";

interface IProps {
	initialData: MembersResult;
	selectedAthlete: Athlete | null;
	activities?: Activities;
	athleteStats: AthleteStats | null;
	isCreateDrawerOpen: boolean;
	isBulkCreateDrawerOpen: boolean;
	isEditingAthlete: boolean;
}

export const AthleteListScene = ({
	initialData,
	selectedAthlete,
	activities = [],
	athleteStats,
	isCreateDrawerOpen,
	isBulkCreateDrawerOpen,
	isEditingAthlete,
}: IProps) => {
	const router = useRouter();
	const { isAdmin } = useCurrentUser();
	const utils = trpcClient.useUtils();
	const athleteBulkColumns = useAthleteBulkColumns();
	const createAthlete = trpcClient.athletes.createAthlete.useMutation({
		onSuccess: async () => {
			await utils.members.getMembers.invalidate();
			router.push(routes.members.list());
			router.refresh();
		},
	});
	const bulkCreateAthletes = trpcClient.athletes.createAthletes.useMutation({
		onSuccess: async () => {
			await utils.members.getMembers.invalidate();
			router.push(routes.members.list());
			router.refresh();
		},
	});
	const updateAthlete = trpcClient.athletes.updateAthlete.useMutation({
		onSuccess: async () => {
			await utils.members.getMembers.invalidate();
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
				<SiteHeader breadcrumbs={[{ label: "Members" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">Members</Heading>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<MemberTable initialData={initialData} />
						</div>
					</div>
				</div>
			</SidebarInset>
			<AthleteCreateDrawer
				isOpen={isCreateDrawerOpen}
				onSubmit={async (data) => {
					await createAthlete.mutateAsync(data);
				}}
				onClose={() => router.push(routes.members.list())}
			/>
			<BulkUploadDrawer<CreateAthlete>
				isOpen={isBulkCreateDrawerOpen}
				onClose={() => router.push(routes.members.list())}
				schema={createAthleteSchema}
				columns={athleteBulkColumns}
				onSubmit={async (athletes) => {
					await bulkCreateAthletes.mutateAsync({ athletes });
				}}
			/>
			<AthleteDetailsDrawer
				isOpen={!!selectedAthlete}
				athlete={selectedAthlete}
				activities={activities}
				athleteStats={athleteStats}
				canEdit={isAdmin}
				startEditing={isEditingAthlete}
				onSubmit={async (data) => {
					await updateAthlete.mutateAsync(data);
				}}
				onClose={() => router.push(routes.members.list())}
			/>
		</SidebarProvider>
	);
};
