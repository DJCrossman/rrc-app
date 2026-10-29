"use client";

import { IconShare3 } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { ShareToChatDialog } from "@/components/chat/share-to-chat-dialog";
import {
	DetailList,
	DetailRow,
	DetailTile,
	DetailTiles,
} from "@/components/drawer-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerCloseButton,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useCurrentUser } from "@/hooks/useAuth";
import {
	formatCompactDuration,
	formatCompactSplit,
	formatMeters,
} from "@/lib/formatters";
import { routes } from "@/lib/routes";
import type { Activity, Boats, Ergs, Workouts } from "@/lib/trpc/types";
import type { CreateActivity, UpdateActivity } from "@/schemas";
import {
	ActivityForm,
	type UploadErgActivityScreenshot,
} from "../ActivityForm/ActivityForm";

interface ActivityDetailsDrawerProps {
	isOpen: boolean;
	activity?: Activity;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	onClose: () => void;
	onSubmit: (data: UpdateActivity) => Promise<void> | void;
	onUploadErgActivityScreenshot: UploadErgActivityScreenshot;
}

export const ActivityDetailsDrawer = ({
	isOpen,
	activity,
	boats,
	ergs,
	workouts,
	onClose,
	onSubmit,
	onUploadErgActivityScreenshot,
}: ActivityDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isImageFullscreen, setIsImageFullscreen] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const { user, hasAthlete } = useCurrentUser();

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
			dismissible={!isImageFullscreen}
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-start justify-between gap-3 border-b">
					<div className="flex min-w-0 flex-col gap-1.5">
						<div className="flex flex-wrap items-center gap-1.5">
							<Badge
								variant="secondary"
								className={
									activity.type === "water"
										? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
										: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
								}
							>
								{activity.type === "water" ? "Water" : "Erg"}
							</Badge>
							{activity.isStrava && <Badge variant="outline">Strava</Badge>}
						</div>
						<DrawerTitle className="truncate text-lg">
							{activity.name}
						</DrawerTitle>
						<DrawerDescription>
							{DateTime.fromISO(activity.startDate).toLocaleString({
								weekday: "short",
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
						</DrawerDescription>
					</div>
					<DrawerCloseButton />
				</DrawerHeader>
				<ShareToChatDialog
					open={isSharing}
					onOpenChange={setIsSharing}
					title={activity.name}
					path={routes.activities.view(activity.id)}
				/>
				<div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
					{isEditing && (
						<ActivityForm
							boats={boats}
							ergs={ergs}
							workouts={workouts}
							defaultValues={
								activity.type === "water"
									? {
											type: "water",
											name: activity.name,
											startDate: activity.startDate,
											timezone: activity.timezone,
											workoutType: activity.workoutType,
											elapsedTime: activity.elapsedTime,
											athleteId: activity.athlete.id,
											boatId: activity.boat?.id,
											workoutId: activity.workout?.id,
											laps: activity.distance / 2000,
											courseType: "course",
										}
									: {
											type: "erg",
											name: activity.name,
											startDate: activity.startDate,
											timezone: activity.timezone,
											workoutType: activity.workoutType,
											elapsedTime: activity.elapsedTime,
											distance: activity.distance,
											athleteId: activity.athlete.id,
											ergId: activity.erg?.id,
											workoutId: activity.workout?.id,
										}
							}
							onCancel={() => setIsEditing(false)}
							onSubmit={async (data: CreateActivity) => {
								await onSubmit({ id: activity.id, ...data });
								setIsEditing(false);
							}}
							onUploadErgActivityScreenshot={onUploadErgActivityScreenshot}
							isImageFullscreen={isImageFullscreen}
							setIsImageFullscreen={setIsImageFullscreen}
						/>
					)}
					{!isEditing && (
						<>
							<DetailTiles>
								<DetailTile label="Distance">
									{formatMeters(activity.distance)}
								</DetailTile>
								<DetailTile label="Time">
									{formatCompactDuration(activity.elapsedTime)}
								</DetailTile>
								{activity.distance > 0 && (
									<DetailTile label="Avg split">
										{formatCompactSplit(
											activity.elapsedTime,
											activity.distance,
										)}
										<span className="text-xs font-normal text-muted-foreground">
											{" "}
											/500m
										</span>
									</DetailTile>
								)}
								<DetailTile label="Workout type">
									{activity.workoutType.charAt(0).toUpperCase() +
										activity.workoutType.slice(1)}
								</DetailTile>
							</DetailTiles>
							<DetailList>
								<DetailRow label="Athlete">{activity.athlete.name}</DetailRow>
								{activity.type === "water" && activity.boat && (
									<DetailRow label="Boat">{activity.boat.name}</DetailRow>
								)}
								{activity.type === "erg" && activity.erg && (
									<DetailRow label="ERG">{activity.erg.name}</DetailRow>
								)}
								{activity.workout && (
									<DetailRow label="Workout">
										{activity.workout.description}
									</DetailRow>
								)}
								{activity.isStrava && (
									<DetailRow label="Source">Synced from Strava</DetailRow>
								)}
							</DetailList>
						</>
					)}
				</div>
				{!isEditing && (
					<DrawerFooter className="flex-row border-t">
						{hasAthlete && activity.athlete.id === user.id && (
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setIsSharing(true)}
							>
								<IconShare3 />
								Share to chat
							</Button>
						)}
						<Button className="flex-1" onClick={() => setIsEditing(true)}>
							Edit
						</Button>
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
};
