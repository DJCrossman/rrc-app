"use client";

import { IconPencil } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { ActivityTable } from "@/components/activities";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	formatManufacturer,
	formatMeters,
	formatSeatSetup,
	formatWeightRange,
} from "@/lib/formatters";
import { routes } from "@/lib/routes";
import type { Activities, Boat } from "@/schemas";
import { BoatForm } from "../BoatCreateScene/components";

interface BoatDetailsSceneProps {
	boat: Boat;
	activities: Activities;
	onSubmit: (data: Boat) => void;
}

export const BoatDetailsScene = ({
	boat,
	activities,
	onSubmit: handleSubmit,
}: BoatDetailsSceneProps) => {
	const [isEditing, setIsEditing] = useState(false);
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
				<SiteHeader
					breadcrumbs={[
						{ label: "Boats", href: routes.boats.list() },
						{ label: boat.name },
					]}
				/>

				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
							<div className="w-full md:w-1/3 p-4">
								<div className="flex justify-between items-center flex-col md:flex-row mb-4">
									<h1 className="text-2xl font-bold">{boat.name}</h1>
									{!isEditing && (
										<div>
											<Button
												variant="link"
												onClick={() => {
													setIsEditing(!isEditing);
												}}
											>
												<IconPencil size={16} />
												Edit
											</Button>
										</div>
									)}
								</div>
								{!isEditing && (
									<div className="space-y-4">
										<p>
											<strong>Manufacturer:</strong>{" "}
											{formatManufacturer(boat.manufacturer)}
										</p>
										<p>
											<strong>Seats:</strong> {formatSeatSetup(boat)}
										</p>
										<p>
											<strong>Rigging:</strong>{" "}
											{boat.rigging.charAt(0).toUpperCase() +
												boat.rigging.slice(1)}
										</p>
										<p>
											<strong>Meters:</strong> {formatMeters(boat.meters)}
										</p>
										<p>
											<strong>Weight Range:</strong>{" "}
											{formatWeightRange(boat.weightRange)}
										</p>
									</div>
								)}
								{!!isEditing && (
									<BoatForm
										onCancel={() => setIsEditing(false)}
										onSubmit={async (value) => {
											await handleSubmit({
												...boat,
												...value,
											});
											setIsEditing(false);
										}}
									/>
								)}
							</div>
						</div>
						<hr className="mx-auto w-[80%]" />
						<div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
							<div className="w-full md:w-2/3 p-4">
								<ActivityTable
									data={activities}
									showColumns={[
										"startDate",
										"name",
										"athlete.name",
										"isStrava",
										"distance",
									]}
								/>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
