"use client";

import { IconPlus } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { redirect } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useNavigate } from "@/hooks/useNavigate";
import { routes } from "@/lib/routes";
import type { CreateWorkout, Workout, Workouts } from "@/schemas";
import { WorkoutCreateDrawer, WorkoutDetailsDrawer } from "./components";
import { WorkoutTable } from "./WorkoutTable/WorkoutTable";

interface WorkoutListSceneProps {
	data: Workouts;
	currentWeekIsoDate: string;
	selectedWorkout: Workout | null;
	isCreateDrawerOpen: boolean;
	onCreateWorkout: (data: CreateWorkout) => Promise<void> | void;
	onUpdateWorkout: (data: Workout) => Promise<void> | void;
}

export const WorkoutListScene = ({
	data,
	currentWeekIsoDate,
	selectedWorkout,
	isCreateDrawerOpen,
	onCreateWorkout,
	onUpdateWorkout,
}: WorkoutListSceneProps) => {
	const router = useNavigate();

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
				onSubmit={onCreateWorkout}
				onClose={() => router.push(routes.workouts.list({ week: currentWeek }))}
			/>
			<WorkoutDetailsDrawer
				isOpen={!!selectedWorkout}
				workout={selectedWorkout}
				onSubmit={onUpdateWorkout}
				onClose={() => router.push(routes.workouts.list({ week: currentWeek }))}
			/>
		</SidebarProvider>
	);
};
