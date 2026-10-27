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
import type { Programs } from "@/lib/trpc/types";
import type { GroupFormValues } from "@/schemas";
import { GroupForm } from "../GroupForm/GroupForm";

interface GroupCreateDrawerProps {
	isOpen: boolean;
	programs: Programs;
	onClose: () => void;
	onSubmit: (data: GroupFormValues) => Promise<void>;
}

export const GroupCreateDrawer = ({
	isOpen,
	programs,
	onClose,
	onSubmit,
}: GroupCreateDrawerProps) => (
	<Drawer
		open={isOpen}
		onOpenChange={(open) => !open && onClose()}
		direction="right"
	>
		<DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
			<DrawerHeader className="flex flex-row items-center justify-between border-b">
				<div>
					<DrawerTitle>New group</DrawerTitle>
					<DrawerDescription>
						Groups fill automatically from RCA memberships
					</DrawerDescription>
				</div>
				<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
					<IconX className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</DrawerClose>
			</DrawerHeader>
			<div className="flex-1 overflow-y-auto p-6">
				{isOpen && (
					<GroupForm
						programs={programs}
						onSubmit={onSubmit}
						onCancel={onClose}
					/>
				)}
			</div>
		</DrawerContent>
	</Drawer>
);
