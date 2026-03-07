"use client";

import { IconPencil, IconX } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { formatCompactSplit, formatDuration } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AnalyticMetrics, CreateWorkout, Workout } from "@/schemas";
import { getWorkoutBreakdown } from "../../utils/getWorkoutBreakdown";
import { intensityColorMap } from "../../utils/intensityColorMap";
import { FragmentSplitDisplay } from "../FragmentSplitDisplay";
import { WorkoutForm } from "../WorkoutForm/WorkoutForm";

interface WorkoutDetailsDrawerProps {
	isOpen: boolean;
	workout: Workout | null;
	onClose: () => void;
	onSubmit: (data: Workout) => Promise<void> | void;
	analytics?: Pick<AnalyticMetrics, "lastTwoKm" | "lastSixKm">;
}

export const WorkoutDetailsDrawer = ({
	isOpen,
	workout,
	onClose,
	onSubmit,
	analytics,
}: WorkoutDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleClose = () => {
		setIsEditing(false);
		onClose();
	};

	const handleSubmit = async (data: { workouts: CreateWorkout[] }) => {
		if (!workout) return;

		await onSubmit({
			...workout,
			...data,
		});
		setIsEditing(false);
	};

	if (!workout) {
		return null;
	}

	const { title, descriptionLines } = getWorkoutBreakdown(workout);

	const startDate = DateTime.fromISO(workout.startDate) ?? undefined;

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			direction="right"
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div className="flex items-center gap-3">
						<DrawerTitle>{title}</DrawerTitle>
						<Badge
							className={cn(
								"border-transparent",
								intensityColorMap[workout.intensityCategory],
							)}
						>
							{workout.intensityCategory}
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
							<IconX className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{isEditing ? (
						<WorkoutForm
							defaultValues={{
								workouts: [
									{
										description: workout.description,
										startDate: startDate?.toISODate() || undefined,
									},
								],
							}}
							onCancel={() => setIsEditing(false)}
							onSubmit={handleSubmit}
						/>
					) : (
						<>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold">Details</h2>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsEditing(true)}
								>
									<IconPencil className="h-4 w-4 mr-2" />
									Edit
								</Button>
							</div>
							<div className="space-y-4">
								<div>
									<strong className="text-sm text-muted-foreground">
										Description
									</strong>
									<p className="text-base">
										{descriptionLines.map((line) => (
											<span className="d-block" key={line}>
												{line}
											</span>
										))}
									</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Start Date
									</strong>
									<p className="text-base">
										{startDate?.toLocaleString(DateTime.DATE_MED) || "N/A"}
									</p>
								</div>
								{workout.elapsedTime && (
									<div>
										<strong className="text-sm text-muted-foreground">
											Duration
										</strong>
										<p className="text-base">
											{formatDuration(workout.elapsedTime)}
										</p>
									</div>
								)}
								{workout.fragments && workout.fragments.length > 0 && (
									<div>
										<strong className="text-sm text-muted-foreground">
											Target Splits
										</strong>{" "}
										<div className="mt-2 mb-3 flex gap-4 text-xs text-muted-foreground">
											{analytics?.lastTwoKm && (
												<div>
													<span className="font-semibold">2K Baseline:</span>{" "}
													<span className="font-mono">
														{formatCompactSplit(
															analytics.lastTwoKm.duration,
															2000,
														)}
														/500m
													</span>
												</div>
											)}
											{analytics?.lastSixKm && (
												<div>
													<span className="font-semibold">6K Baseline:</span>{" "}
													<span className="font-mono">
														{formatCompactSplit(
															analytics.lastSixKm.duration,
															6000,
														)}
														/500m
													</span>
												</div>
											)}
										</div>{" "}
										<div className="mt-2 space-y-3">
											{workout.fragments.map((fragment, index) => (
												<FragmentSplitDisplay
													key={`${fragment.relativeTo}-${fragment.relativeSplit}-${index}`}
													fragment={fragment}
													lastTwoKm={analytics?.lastTwoKm}
													lastSixKm={analytics?.lastSixKm}
												/>
											))}
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
};
