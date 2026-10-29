"use client";

import {
	Drawer,
	DrawerCloseButton,
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
				<DrawerCloseButton />
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
