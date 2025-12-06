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
import type { CreateBoat } from "@/schemas";
import { BoatForm } from "../BoatForm/BoatForm";

interface BoatCreateDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: CreateBoat) => Promise<void> | void;
}

export const BoatCreateDrawer = ({
	isOpen,
	onClose,
	onSubmit,
}: BoatCreateDrawerProps) => {
	const handleSubmit = async (data: CreateBoat) => {
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
						<DrawerTitle>Add Boat</DrawerTitle>
						<DrawerDescription>Create a new boat profile</DrawerDescription>
					</div>
					<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DrawerClose>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					<BoatForm onCancel={onClose} onSubmit={handleSubmit} />
				</div>
			</DrawerContent>
		</Drawer>
	);
};
