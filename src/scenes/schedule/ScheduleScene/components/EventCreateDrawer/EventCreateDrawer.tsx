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
import type { CreateEvent, EventFormInput } from "@/schemas";
import { getNewEventFormValues } from "../../utils/getEventFormValues";
import { EventCreateForm } from "../EventCreateForm/EventCreateForm";

interface EventCreateDrawerProps {
	isOpen: boolean;
	defaultDate: string;
	defaultValues?: EventFormInput;
	onClose: () => void;
	onSubmit: (input: CreateEvent) => Promise<void>;
}

export const EventCreateDrawer = ({
	isOpen,
	defaultDate,
	defaultValues,
	onClose,
	onSubmit,
}: EventCreateDrawerProps) => (
	<Drawer
		open={isOpen}
		onOpenChange={(open) => !open && onClose()}
		direction="right"
	>
		<DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
			<DrawerHeader className="flex flex-row items-center justify-between border-b">
				<div>
					<DrawerTitle>New event</DrawerTitle>
					<DrawerDescription>
						Add a training, regatta or volunteer shift
					</DrawerDescription>
				</div>
				<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
					<IconX className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</DrawerClose>
			</DrawerHeader>
			<div className="flex-1 overflow-y-auto p-6">
				{isOpen && (
					<EventCreateForm
						defaultValues={defaultValues ?? getNewEventFormValues(defaultDate)}
						onSubmit={onSubmit}
						onCancel={onClose}
					/>
				)}
			</div>
		</DrawerContent>
	</Drawer>
);
