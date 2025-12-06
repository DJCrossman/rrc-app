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
import {
	formatManufacturer,
	formatMeters,
	formatSeatSetup,
	formatWeightRange,
} from "@/lib/formatters";
import type { Activities, Boat, CreateBoat } from "@/schemas";
import { BoatForm } from "../BoatForm/BoatForm";

interface BoatDetailsDrawerProps {
	isOpen: boolean;
	boat: Boat | null;
	activities: Activities;
	onClose: () => void;
	onSubmit: (data: Boat) => Promise<void> | void;
}

export const BoatDetailsDrawer = ({
	isOpen,
	boat,
	activities,
	onClose,
	onSubmit,
}: BoatDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleClose = () => {
		setIsEditing(false);
		onClose();
	};

	const handleSubmit = async (data: CreateBoat) => {
		if (!boat) return;

		await onSubmit({
			...boat,
			...data,
		});
		setIsEditing(false);
	};

	if (!boat) {
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
						<DrawerTitle>{boat.name}</DrawerTitle>
						<DrawerDescription>
							Boat details and activity history
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
						<BoatForm
							initialValues={boat}
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
									<p className="text-base">
										{formatManufacturer(boat.manufacturer)}
									</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Seats
									</strong>
									<p className="text-base">{formatSeatSetup(boat)}</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Rigging
									</strong>
									<p className="text-base">
										{boat.rigging.charAt(0).toUpperCase() +
											boat.rigging.slice(1)}
									</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Meters
									</strong>
									<p className="text-base">{formatMeters(boat.meters)}</p>
								</div>
								<div>
									<strong className="text-sm text-muted-foreground">
										Weight Range
									</strong>
									<p className="text-base">
										{formatWeightRange(boat.weightRange)}
									</p>
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
