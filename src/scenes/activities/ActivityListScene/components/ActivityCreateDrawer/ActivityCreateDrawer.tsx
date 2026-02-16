"use client";

import { IconX } from "@tabler/icons-react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import type { Athlete, Boats, CreateActivity, Ergs, Workouts } from "@/schemas";
import { ActivityForm } from "../ActivityForm/ActivityForm";

interface ActivityCreateDrawerProps {
	isOpen: boolean;
	currentAthlete: Athlete;
	boats: Boats;
	ergs: Ergs;
	workouts: Workouts;
	onSubmit: (data: CreateActivity) => Promise<void> | void;
	onUploadActivityScreenshot?: (
		file: File,
	) => Promise<{ success: boolean; data?: CreateActivity }>;
	onClose: () => void;
}

export const ActivityCreateDrawer = ({
	isOpen,
	currentAthlete,
	boats,
	ergs,
	workouts,
	onUploadActivityScreenshot,
	onClose,
	onSubmit,
}: ActivityCreateDrawerProps) => (
	<Drawer
		open={isOpen}
		onOpenChange={(open) => !open && onClose()}
		direction="right"
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
					athlete={currentAthlete}
					boats={boats}
					ergs={ergs}
					workouts={workouts}
					onSubmit={async (data: CreateActivity) => {
						await onSubmit(data);
						onClose();
					}}
					onCancel={onClose}
					onUploadActivityScreenshot={onUploadActivityScreenshot}
				/>
			</div>
		</DrawerContent>
	</Drawer>
);
