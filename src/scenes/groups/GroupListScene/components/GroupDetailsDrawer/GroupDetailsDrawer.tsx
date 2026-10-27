"use client";

import { IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import type { Group, Programs } from "@/lib/trpc/types";
import type { UpdateGroup } from "@/schemas";
import { GroupForm } from "../GroupForm/GroupForm";
import { ProgramHoverCard } from "../ProgramHoverCard/ProgramHoverCard";
import { GroupMemberList } from "./GroupMemberList";

interface GroupDetailsDrawerProps {
	isOpen: boolean;
	group: Group | null;
	programs: Programs;
	canEdit: boolean;
	onClose: () => void;
	onSubmit: (data: UpdateGroup) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}

export const GroupDetailsDrawer = ({
	isOpen,
	group,
	programs,
	canEdit,
	onClose,
	onSubmit,
	onDelete,
}: GroupDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	if (!group) {
		return null;
	}

	const includedPrograms = programs.filter((program) =>
		group.programs.some(({ id }) => id === program.id),
	);

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => {
				if (open) return;
				setIsEditing(false);
				setIsConfirmingDelete(false);
				onClose();
			}}
			direction="right"
		>
			<DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
				<DrawerHeader className="flex flex-row items-center justify-between gap-3 border-b">
					<div className="min-w-0">
						<DrawerTitle className="truncate">{group.name}</DrawerTitle>
						<DrawerDescription>
							{group.memberCount}{" "}
							{group.memberCount === 1 ? "member" : "members"} · chat + schedule
						</DrawerDescription>
					</div>
					<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DrawerClose>
				</DrawerHeader>
				<div className="flex-1 space-y-8 overflow-y-auto p-6">
					<section className="space-y-4">
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-semibold">Details</h3>
							{canEdit && !isEditing && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="ml-auto"
									onClick={() => setIsEditing(true)}
								>
									<IconPencil />
									Edit
								</Button>
							)}
						</div>
						{isEditing ? (
							<GroupForm
								initialValues={{
									name: group.name,
									programIds: group.programs.map(({ id }) => id),
								}}
								programs={programs}
								onSubmit={async (data) => {
									await onSubmit({ id: group.id, ...data });
									setIsEditing(false);
								}}
								onCancel={() => setIsEditing(false)}
							/>
						) : (
							<dl className="space-y-4">
								<DetailRow label="Auto-include RCA memberships">
									{includedPrograms.length ? (
										<div className="flex flex-wrap gap-2 pt-1">
											{includedPrograms.map((program) => (
												<ProgramHoverCard key={program.id} program={program}>
													<Badge variant="outline">{program.name}</Badge>
												</ProgramHoverCard>
											))}
										</div>
									) : (
										<span className="text-muted-foreground">
											None selected, so the group has no members.
										</span>
									)}
								</DetailRow>
							</dl>
						)}
					</section>
					{!isEditing && (
						<section className="space-y-3">
							<h3 className="text-sm font-semibold">Members</h3>
							<GroupMemberList members={group.members} />
						</section>
					)}
				</div>
				{canEdit && !isEditing && (
					<DrawerFooter className="flex-row items-center justify-end border-t">
						{isConfirmingDelete ? (
							<>
								<span className="mr-auto text-sm">Delete this group?</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setIsConfirmingDelete(false)}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									disabled={isDeleting}
									onClick={async () => {
										setIsDeleting(true);
										try {
											await onDelete(group.id);
										} finally {
											setIsDeleting(false);
										}
									}}
								>
									Delete
								</Button>
							</>
						) : (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsConfirmingDelete(true)}
							>
								<IconTrash />
								Delete group
							</Button>
						)}
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
};

const DetailRow = ({
	label,
	children,
}: React.PropsWithChildren<{ label: string }>) => (
	<div>
		<dt className="text-xs text-muted-foreground">{label}</dt>
		<dd className="text-sm">{children}</dd>
	</div>
);
