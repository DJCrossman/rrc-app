"use client";

import { IconPencil, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { ActivityTable } from "@/components/activities";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { formatMeters } from "@/lib/formatters";
import type { Activities, CreateErg, Erg } from "@/schemas";
import { ErgForm } from "../ErgForm/ErgForm";

interface ErgDetailsDrawerProps {
	isOpen: boolean;
	erg: Erg | null;
	activities: Activities;
	onClose: () => void;
	onSubmit: (data: Erg) => Promise<void> | void;
}

export const ErgDetailsDrawer = ({
	isOpen,
	erg,
	activities,
	onClose,
	onSubmit,
}: ErgDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleClose = () => {
		setIsEditing(false);
		onClose();
	};

	const handleSubmit = async (data: CreateErg) => {
		if (!erg) return;

		await onSubmit({
			...erg,
			...data,
		});
		setIsEditing(false);
	};

	if (!erg) {
		return null;
	}

	return (
		<Drawer
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			direction="right"
		>
			<DrawerContent>
				<DrawerHeader className="flex flex-row items-center justify-between border-b">
					<div>
						<DrawerTitle>{erg.name}</DrawerTitle>
						<DrawerDescription>
							ERG details and activity history
						</DrawerDescription>
					</div>
					<div className="flex items-center gap-2">
						<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
							<IconX className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{isEditing ? (
						<ErgForm
							defaultValues={{
								name: erg.name,
								manufacturer: erg.manufacturer,
								serialNumber: erg.serialNumber,
								firmwareVersion: erg.firmwareVersion,
								hardwareVersion: erg.hardwareVersion,
								dataCode: erg.dataCode,
							}}
							onCancel={() => setIsEditing(false)}
							onSubmit={handleSubmit}
						/>
					) : (
						<>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold">Details</h2>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsEditing(true)}
								>
									<IconPencil className="h-4 w-4 mr-2" />
									Edit
								</Button>
							</div>
							<div className="space-y-4">
								<div>
									<strong className="text-sm text-muted-foreground">
										Manufacturer
									</strong>
									<p className="text-base">{erg.manufacturer.toUpperCase()}</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Serial Number
									</strong>
									<p className="text-base">
										{erg.serialNumber || "Not specified"}
									</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Firmware Version
									</strong>
									<p className="text-base">
										{erg.firmwareVersion || "Not specified"}
									</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Hardware Version
									</strong>
									<p className="text-base">
										{erg.hardwareVersion || "Not specified"}
									</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Data Code
									</strong>
									<p className="text-base">{erg.dataCode || "Not specified"}</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Total Meters
									</strong>
									<p className="text-base">{formatMeters(erg.meters)}</p>
								</div>
							</div>

							<div className="space-y-4 pt-6 border-t">
								<h2 className="text-xl font-semibold">Activities</h2>
								<ActivityTable
									data={activities}
									showColumns={[
										"startDate",
										"name",
										"athlete.name",
										"isStrava",
										"distance",
									]}
								/>
							</div>
						</>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
};
