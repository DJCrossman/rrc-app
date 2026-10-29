"use client";

import {
	Drawer,
	DrawerCloseButton,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import type { CreateAthlete } from "@/schemas";
import { AthleteForm } from "../AthleteForm/AthleteForm";

interface AthleteCreateDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: CreateAthlete) => Promise<void> | void;
}

export const AthleteCreateDrawer = ({
	isOpen,
	onClose,
	onSubmit,
}: AthleteCreateDrawerProps) => {
	const handleSubmit = async (data: CreateAthlete) => {
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
						<DrawerTitle>Add Member</DrawerTitle>
						<DrawerDescription>Create a new member profile</DrawerDescription>
					</div>
					<DrawerCloseButton />
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					<AthleteForm onSubmit={handleSubmit} onCancel={onClose} />
				</div>
			</DrawerContent>
		</Drawer>
	);
};
