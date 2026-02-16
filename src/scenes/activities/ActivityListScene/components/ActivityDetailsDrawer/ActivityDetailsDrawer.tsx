"use client";

import { IconPencil, IconX } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { formatDuration } from "@/lib/formatters/formatDuration";
import { formatMeters } from "@/lib/formatters/formatMeters";
import type {
	Activity,
	Boats,
	CreateActivity,
	Ergs,
	UpdateActivity,
	Workouts,
} from "@/schemas";
import { ActivityForm } from "../ActivityForm/ActivityForm";

interface ActivityDetailsDrawerProps {
	isOpen: boolean;
	activity: Activity | null;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	onClose: () => void;
	onSubmit: (data: UpdateActivity) => Promise<void> | void;
	onUploadActivityScreenshot?: (
		file: File,
	) => Promise<{ success: boolean; data?: CreateActivity }>;
}

export const ActivityDetailsDrawer = ({
	isOpen,
	activity,
	boats,
	ergs,
	workouts,
	onClose,
	onSubmit,
	onUploadActivityScreenshot,
}: ActivityDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);

	if (!activity) {
		return null;
	}

	const handleClose = () => {
		setIsEditing(false);
		onClose();
	};

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			direction="right"
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div>
						<DrawerTitle>{activity.name}</DrawerTitle>
						<DrawerDescription>Activity details</DrawerDescription>
					</div>
					<div className="flex items-center gap-2">
						<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
							<IconX className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{isEditing && (
						<ActivityForm
							boats={boats}
							ergs={ergs}
							workouts={workouts}
							defaultValues={{
								type: activity.type,
								name: activity.name,
								startDate: activity.startDate,
								timezone: activity.timezone,
								workoutType: activity.workoutType,
								elapsedTime: activity.elaspedTime,
								distance: activity.distance,
								athleteId: activity.athlete.id,
								boatId: activity.boat?.id,
								ergId: activity.erg?.id,
								workoutId: activity.workout?.id || null,
							}}
							onCancel={() => setIsEditing(false)}
							onSubmit={async (data: CreateActivity) => {
								await onSubmit({ id: activity.id, ...data });
								setIsEditing(false);
							}}
							onUploadActivityScreenshot={onUploadActivityScreenshot}
						/>
					)}
					{!isEditing && (
						<>
							{/* Activity Details Section */}
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
									<strong>Type:</strong>{" "}
									{activity.type === "water" ? "Water" : "ERG"}
								</div>
								<div>
									<strong>Athlete:</strong> {activity.athlete.name}
								</div>
								{activity.boat && (
									<div>
										<strong>Boat:</strong> {activity.boat.name}
									</div>
								)}
								{activity.erg && (
									<div>
										<strong>ERG:</strong> {activity.erg.name}
									</div>
								)}
								{activity.workout && (
									<div>
										<strong>Workout:</strong> {activity.workout.description}
									</div>
								)}
								<div>
									<strong>Date:</strong>{" "}
									{DateTime.fromISO(activity.startDate).toLocaleString(
										DateTime.DATETIME_MED,
									)}
								</div>
								<div>
									<strong>Distance:</strong> {formatMeters(activity.distance)}
								</div>
								<div>
									<strong>Time:</strong> {formatDuration(activity.elaspedTime)}
								</div>
								<div>
									<strong>Workout Type:</strong>{" "}
									{activity.workoutType.charAt(0).toUpperCase() +
										activity.workoutType.slice(1)}
								</div>
								{activity.isStrava && (
									<div>
										<strong>Strava:</strong> Synced from Strava
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
