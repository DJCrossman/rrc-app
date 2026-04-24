"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type {
	Activities,
	Activity,
	Athlete,
	Boats,
	Ergs,
	Workouts,
} from "@/lib/trpc/types";
import type { CreateActivity } from "@/schemas";
import {
	ActivityCreateDrawer,
	ActivityDetailsDrawer,
	ActivityTable,
} from "./components";
import type { UploadErgActivityScreenshot } from "./components/ActivityForm/ActivityForm";

interface ActivityListSceneProps {
	data: Activities;
	selectedActivity: Activity | null;
	currentAthlete: Athlete;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	isCreateDrawerOpen: boolean;
	isAIEnabled: boolean;
}

const uploadErgActivityScreenshot: UploadErgActivityScreenshot = async ({
	file,
	athleteId,
	ergId,
}) => {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("athleteId", athleteId);
	if (ergId) formData.append("ergId", ergId);

	const response = await fetch("/api/v1/activities/screenshot", {
		method: "POST",
		body: formData,
	});
	if (!response.ok) {
		return { success: false };
	}
	return (await response.json()) as {
		success: boolean;
		data?: CreateActivity;
	};
};

export const ActivityListScene = ({
	data,
	selectedActivity,
	currentAthlete,
	boats,
	ergs,
	workouts,
	isCreateDrawerOpen,
	isAIEnabled,
}: ActivityListSceneProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const createActivity = trpcClient.activities.createActivity.useMutation({
		onSuccess: async () => {
			await utils.activities.getActivities.invalidate();
			router.push(routes.activities.list());
			router.refresh();
		},
	});
	const updateActivity = trpcClient.activities.updateActivity.useMutation({
		onSuccess: async () => {
			await utils.activities.getActivities.invalidate();
			await utils.activities.getActivityById.invalidate();
			router.refresh();
		},
	});

	const onUploadErgActivityScreenshot = isAIEnabled
		? uploadErgActivityScreenshot
		: undefined;

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
			{!!currentAthlete && (
				<ActivityCreateDrawer
					isOpen={isCreateDrawerOpen}
					currentAthlete={currentAthlete}
					boats={boats}
					ergs={ergs}
					workouts={workouts}
					onSubmit={async (data) => {
						await createActivity.mutateAsync(data);
					}}
					onUploadErgActivityScreenshot={onUploadErgActivityScreenshot}
					onClose={() => router.push(routes.activities.list())}
				/>
			)}
			<ActivityDetailsDrawer
				isOpen={!!selectedActivity}
				activity={selectedActivity}
				boats={boats}
				ergs={ergs}
				workouts={workouts}
				onSubmit={async (data) => {
					await updateActivity.mutateAsync(data);
				}}
				onUploadErgActivityScreenshot={onUploadErgActivityScreenshot}
				onClose={() => router.push(routes.activities.list())}
			/>
		</SidebarProvider>
	);
};
