"use client";

import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useNavigate } from "@/hooks/useNavigate";
import { routes } from "@/lib/routes";
import type {
	Activities,
	Activity,
	Athletes,
	Boats,
	CreateActivity,
	Ergs,
	UpdateActivity,
	Workouts,
} from "@/schemas";
import {
	ActivityCreateDrawer,
	ActivityDetailsDrawer,
	ActivityTable,
} from "./components";

interface ActivityListSceneProps {
	data: Activities;
	selectedActivity: Activity | null;
	athletes: Athletes;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	isCreateDrawerOpen: boolean;
	onCreateActivity: (data: CreateActivity) => Promise<void> | void;
	onUpdateActivity: (data: UpdateActivity) => Promise<void> | void;
}

export const ActivityListScene = ({
	data,
	selectedActivity,
	athletes,
	boats,
	ergs,
	workouts,
	isCreateDrawerOpen,
	onCreateActivity,
	onUpdateActivity,
}: ActivityListSceneProps) => {
	const router = useNavigate();

	const handleUploadActivityScreenshot = async (file: File) => {
		// Mock implementation - log to console as requested
		console.log("Upload activity screenshot:", file.name, file);
		return { success: false, data: undefined };
	};

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
				<SiteHeader breadcrumbs={[{ label: "Activities" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">Activities</Heading>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<ActivityTable data={data} />
						</div>
					</div>
				</div>
			</SidebarInset>
			<ActivityCreateDrawer
				isOpen={isCreateDrawerOpen}
				athletes={athletes}
				boats={boats}
				ergs={ergs}
				workouts={workouts}
				onSubmit={onCreateActivity}
				onUploadActivityScreenshot={handleUploadActivityScreenshot}
				onClose={() => router.push(routes.activities.list())}
			/>
			<ActivityDetailsDrawer
				isOpen={!!selectedActivity}
				activity={selectedActivity}
				athletes={athletes}
				boats={boats}
				ergs={ergs}
				workouts={workouts}
				onSubmit={onUpdateActivity}
				onUploadActivityScreenshot={handleUploadActivityScreenshot}
				onClose={() => router.push(routes.activities.list())}
			/>
		</SidebarProvider>
	);
};
