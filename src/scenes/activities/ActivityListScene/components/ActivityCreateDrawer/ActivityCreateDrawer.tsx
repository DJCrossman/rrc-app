"use client";

import { useState } from "react";
import {
	Drawer,
	DrawerCloseButton,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import type { Athlete, Boats, Ergs, Workouts } from "@/lib/trpc/types";
import type { CreateActivity } from "@/schemas";
import {
	ActivityForm,
	type UploadErgActivityScreenshot,
} from "../ActivityForm/ActivityForm";

interface ActivityCreateDrawerProps {
	isOpen: boolean;
	currentAthlete: Athlete;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	onSubmit: (data: CreateActivity) => Promise<void> | void;
	onUploadErgActivityScreenshot: UploadErgActivityScreenshot;
	onClose: () => void;
}

export const ActivityCreateDrawer = ({
	isOpen,
	currentAthlete,
	boats,
	ergs,
	workouts,
	onUploadErgActivityScreenshot,
	onClose,
	onSubmit,
}: ActivityCreateDrawerProps) => {
	const [isImageFullscreen, setIsImageFullscreen] = useState(false);

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			direction="right"
			dismissible={!isImageFullscreen}
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div>
						<DrawerTitle>Add Activity</DrawerTitle>
						<DrawerDescription>Create a new activity</DrawerDescription>
					</div>
					<DrawerCloseButton />
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					<ActivityForm
						defaultValues={{
							athleteId: currentAthlete.id,
						}}
						boats={boats}
						ergs={ergs}
						workouts={workouts}
						onSubmit={async (data: CreateActivity) => {
							await onSubmit(data);
							onClose();
						}}
						onCancel={onClose}
						onUploadErgActivityScreenshot={onUploadErgActivityScreenshot}
						isImageFullscreen={isImageFullscreen}
						setIsImageFullscreen={setIsImageFullscreen}
					/>
				</div>
			</DrawerContent>
		</Drawer>
	);
};
