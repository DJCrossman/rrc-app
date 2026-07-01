"use client";

import { useRouter } from "next/navigation";
import type { default as React } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BulkUploadDrawer } from "@/components/bulk-upload-drawer";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSuggestedWeightRange } from "@/lib/data/boat-weight-suggestions";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { Activities, Boat, BoatsResult } from "@/lib/trpc/types";
import {
	type BulkCreateBoatRow,
	bulkCreateBoatRowSchema,
	type CreateBoat,
	type ManufacturerType,
	type SeatType,
} from "@/schemas";
import { BoatCreateDrawer, BoatDetailsDrawer, BoatTable } from "./components";
import { useBoatBulkColumns } from "./components/useBoatBulkColumns";

interface IProps {
	initialData: BoatsResult;
	selectedBoat: Boat | null;
	activities?: Activities;
	isCreateDrawerOpen: boolean;
	isBulkCreateDrawerOpen: boolean;
}

export const BoatListScene = ({
	initialData,
	selectedBoat,
	activities = [],
	isCreateDrawerOpen,
	isBulkCreateDrawerOpen,
}: IProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const boatBulkColumns = useBoatBulkColumns();
	const createBoat = trpcClient.boats.createBoat.useMutation({
		onSuccess: async () => {
			await utils.boats.getBoats.invalidate();
			router.push(routes.boats.list());
			router.refresh();
		},
	});
	const bulkCreateBoats = trpcClient.boats.createBoats.useMutation({
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
							<BoatTable initialData={initialData} />
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
			<BulkUploadDrawer<BulkCreateBoatRow>
				isOpen={isBulkCreateDrawerOpen}
				onClose={() => router.push(routes.boats.list())}
				schema={bulkCreateBoatRowSchema}
				columns={boatBulkColumns}
				onSuggest={(row) => {
					const suggestion = getSuggestedWeightRange(
						row.manufacturer as ManufacturerType | undefined,
						row.seats as SeatType | undefined,
					);
					if (!suggestion) return row;
					return {
						...row,
						weightMin: suggestion.min,
						weightMax: suggestion.max,
						weightUnit: suggestion.unit,
					};
				}}
				suggestTooltip="Auto-fill weight ranges from manufacturer and seats"
				onSubmit={async (rows) => {
					const boats: CreateBoat[] = rows.map((row) => ({
						name: row.name,
						manufacturer: row.manufacturer,
						seats: row.seats,
						rigging: row.rigging,
						weightRange: {
							min: row.weightMin,
							max: row.weightMax,
							unit: row.weightUnit,
						},
					}));
					await bulkCreateBoats.mutateAsync({ boats });
				}}
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
