"use client";

import {
	Drawer,
	DrawerCloseButton,
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
					<DrawerCloseButton />
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					<BoatForm onCancel={onClose} onSubmit={handleSubmit} />
				</div>
			</DrawerContent>
		</Drawer>
	);
};
