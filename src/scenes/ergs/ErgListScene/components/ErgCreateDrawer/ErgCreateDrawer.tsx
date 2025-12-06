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
import type { CreateErg } from "@/schemas";
import { ErgForm } from "../ErgForm/ErgForm";

interface ErgCreateDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: CreateErg) => Promise<void> | void;
}

export const ErgCreateDrawer = ({
	isOpen,
	onClose,
	onSubmit,
}: ErgCreateDrawerProps) => {
	const handleSubmit = async (data: CreateErg) => {
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
						<DrawerTitle>Add ERG</DrawerTitle>
						<DrawerDescription>
							Create a new ergometer profile
						</DrawerDescription>
					</div>
					<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DrawerClose>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6">
					<ErgForm onSubmit={handleSubmit} onCancel={onClose} />
				</div>
			</DrawerContent>
		</Drawer>
	);
};
