"use client";

import { IconPlus } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { redirect, useRouter } from "next/navigation";
import type React from "react";
import type { UploadWorkoutScreenshotResult } from "@/app/api/v1/workouts/screenshot/route";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { trpcClient } from "@/lib/trpc/client";
import type { AnalyticMetrics, Workout, Workouts } from "@/lib/trpc/types";
import { WorkoutCreateDrawer, WorkoutDetailsDrawer } from "./components";
import { WorkoutTable } from "./WorkoutTable/WorkoutTable";

interface WorkoutListSceneProps {
	data: Workouts;
	currentWeekIsoDate: string;
	selectedWorkout: Workout | null;
	isCreateDrawerOpen: boolean;
	analyticMetrics?: Pick<AnalyticMetrics, "lastTwoKm" | "lastSixKm">;
	isAIEnabled: boolean;
}

export const WorkoutListScene = ({
	data,
	currentWeekIsoDate,
	selectedWorkout,
	isCreateDrawerOpen,
	analyticMetrics,
	isAIEnabled,
}: WorkoutListSceneProps) => {
	const router = useRouter();
	const utils = trpcClient.useUtils();
	const createWorkout = trpcClient.workouts.createWorkout.useMutation();
	const updateWorkout = trpcClient.workouts.updateWorkout.useMutation({
		onSuccess: async () => {
			await utils.workouts.getWorkouts.invalidate();
			await utils.workouts.getWorkoutById.invalidate();
			router.refresh();
		},
	});

	const currentWeek = DateTime.fromISO(currentWeekIsoDate);

	if (!currentWeek.isValid) {
		throw new Error("Invalid week date");
	}

	if (currentWeek.weekday !== 7) {
		const url = new URL(window.location.href);
		url.searchParams.set(
			"week",
			currentWeek.startOf("week").minus({ days: 1 }).toISODate(),
		);
		return redirect(url.toString());
	}

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
				<SiteHeader breadcrumbs={[{ label: "Workouts" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between p-4 lg:px-6">
							<Heading as="h1">Training Plan</Heading>
							<div className="flex items-center gap-2">
								<Button asChild variant="outline" size="sm">
									<a href={routes.workouts.create({ week: currentWeek })}>
										<IconPlus />
										<span className="hidden lg:inline">Add Workout</span>
									</a>
								</Button>
							</div>
						</div>
						<div className="flex flex-col gap-4 md:gap-6">
							<WorkoutTable
								data={data}
								currentWeek={currentWeek}
								onWeekChange={(week) =>
									router.replace(routes.workouts.list({ week }))
								}
							/>
						</div>
					</div>
				</div>
			</SidebarInset>
			<WorkoutCreateDrawer
				isOpen={isCreateDrawerOpen}
				onSubmit={async ({ workouts }) => {
					const week = DateTime.fromISO(workouts[0].startDate);
					for (const workout of workouts) {
						await createWorkout.mutateAsync(workout);
					}
					await utils.workouts.getWorkouts.invalidate();
					router.push(
						routes.workouts.list({ week: week.isValid ? week : undefined }),
					);
					router.refresh();
				}}
				onUploadWorkoutScreenshot={async (
					file: File,
				): Promise<UploadWorkoutScreenshotResult> => {
					if (!isAIEnabled) {
						throw new Error("AI features are not enabled");
					}
					const formData = new FormData();
					formData.append("file", file);

					const response = await fetch("/api/v1/workouts/screenshot", {
						method: "POST",
						body: formData,
					});
					if (!response.ok) {
						throw new Error(
							(await response.json()).error ||
								"Failed to parse workout screenshot",
						);
					}
					return (await response.json()) as UploadWorkoutScreenshotResult;
				}}
				onClose={() => router.push(routes.workouts.list({ week: currentWeek }))}
			/>
			<WorkoutDetailsDrawer
				isOpen={!!selectedWorkout}
				workout={selectedWorkout}
				onSubmit={async (data) => {
					await updateWorkout.mutateAsync(data);
				}}
				onClose={() => router.push(routes.workouts.list({ week: currentWeek }))}
				analytics={analyticMetrics}
			/>
		</SidebarProvider>
	);
};
