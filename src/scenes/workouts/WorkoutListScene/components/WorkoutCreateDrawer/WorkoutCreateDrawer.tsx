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
import type { CreateWorkout } from "@/schemas";
import { WorkoutForm } from "../WorkoutForm/WorkoutForm";

interface WorkoutCreateDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: CreateWorkout) => Promise<void> | void;
}

export const WorkoutCreateDrawer = ({
	isOpen,
	onClose,
	onSubmit,
}: WorkoutCreateDrawerProps) => {
	const handleSubmit = async (data: CreateWorkout) => {
		await onSubmit(data);
		onClose();
	};

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			direction="right"
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div>
						<DrawerTitle>Add Workout</DrawerTitle>
						<DrawerDescription>Create a new workout</DrawerDescription>
					</div>
					<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DrawerClose>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					<WorkoutForm onSubmit={handleSubmit} onCancel={onClose} />
				</div>
			</DrawerContent>
		</Drawer>
	);
};
