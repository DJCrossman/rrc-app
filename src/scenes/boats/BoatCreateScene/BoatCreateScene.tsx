"use client";

import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { BoatForm } from "@/scenes/boats/BoatCreateScene/components/BoatForm/BoatForm";
import type { CreateBoat } from "@/schemas";

interface BoatCreateSceneProps {
	onSubmit: (data: CreateBoat) => void;
}

export const BoatCreateScene = ({
	onSubmit: handleSubmit,
}: BoatCreateSceneProps) => {
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
						{ label: "Create Boat" },
					]}
				/>
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
							<div className="w-full md:w-1/3 p-4">
								<h1 className="text-2xl font-bold mb-4">Create a New Boat</h1>
								<BoatForm
									onCancel={routes.boats.list()}
									onSubmit={handleSubmit}
								/>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
