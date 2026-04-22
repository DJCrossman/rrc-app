"use client";

import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { Athlete } from "@/app/api/v1/athletes/actions";
import type { Boats } from "@/app/api/v1/boats/actions";
import type { Ergs } from "@/app/api/v1/ergs/actions";
import type { Workouts } from "@/app/api/v1/workouts/actions";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
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
	onUploadErgActivityScreenshot?: UploadErgActivityScreenshot;
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
					<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DrawerClose>
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
