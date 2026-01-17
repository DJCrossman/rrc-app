"use client";

import { IconPencil, IconX } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { formatDuration } from "@/lib/formatters";
import type { CreateWorkout, Workout } from "@/schemas";
import { getWorkoutBreakdown } from "../../utils/getWorkoutBreakdown";
import { WorkoutForm } from "../WorkoutForm/WorkoutForm";

interface WorkoutDetailsDrawerProps {
	isOpen: boolean;
	workout: Workout | null;
	onClose: () => void;
	onSubmit: (data: Workout) => Promise<void> | void;
}

export const WorkoutDetailsDrawer = ({
	isOpen,
	workout,
	onClose,
	onSubmit,
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
					<div>
						<DrawerTitle>{title}</DrawerTitle>
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
											<div key={line}>{line}</div>
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
								{workout.elaspedTime && (
									<div>
										<strong className="text-sm text-muted-foreground">
											Duration
										</strong>
										<p className="text-base">
											{formatDuration(workout.elaspedTime)}
										</p>
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
