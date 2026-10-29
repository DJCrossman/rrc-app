"use client";

import { useState } from "react";
import { ActivityTable } from "@/components/activities";
import {
	DetailTile,
	DetailTiles,
	SectionLabel,
} from "@/components/drawer-details";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerCloseButton,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	formatManufacturer,
	formatMeters,
	formatSeatSetup,
	formatWeightRange,
} from "@/lib/formatters";
import type { Activities, Boat } from "@/lib/trpc/types";
import type { CreateBoat, UpdateBoat } from "@/schemas";
import { BoatForm } from "../BoatForm/BoatForm";

interface BoatDetailsDrawerProps {
	isOpen: boolean;
	boat: Boat | null;
	activities: Activities;
	onClose: () => void;
	onSubmit: (data: UpdateBoat) => Promise<void> | void;
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
			...data,
			id: boat.id,
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
				<DrawerHeader className="flex flex-row items-center justify-between gap-3 border-b">
					<div className="flex min-w-0 items-center gap-3">
						<span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-base font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
							{formatSeatSetup(boat)}
						</span>
						<div className="min-w-0">
							<DrawerTitle className="truncate text-lg">
								{boat.name}
							</DrawerTitle>
							<DrawerDescription>
								{formatManufacturer(boat.manufacturer)} · {formatRigging(boat)}
							</DrawerDescription>
						</div>
					</div>
					<DrawerCloseButton />
				</DrawerHeader>
				<div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
					{isEditing ? (
						<BoatForm
							initialValues={boat}
							onCancel={() => setIsEditing(false)}
							onSubmit={handleSubmit}
						/>
					) : (
						<>
							<DetailTiles>
								<DetailTile label="Manufacturer">
									{formatManufacturer(boat.manufacturer)}
								</DetailTile>
								<DetailTile label="Seats">{formatSeatSetup(boat)}</DetailTile>
								<DetailTile label="Rigging">{formatRigging(boat)}</DetailTile>
								<DetailTile label="Weight Range">
									{formatWeightRange(boat.weightRange)}
								</DetailTile>
								<DetailTile label="Meters rowed" className="col-span-2">
									{formatMeters(boat.meters)}
								</DetailTile>
							</DetailTiles>
							<div className="space-y-3">
								<SectionLabel>Recent activity</SectionLabel>
								<div className="overflow-x-auto">
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
							</div>
						</>
					)}
				</div>
				{!isEditing && (
					<DrawerFooter className="flex-row border-t">
						<Button className="flex-1" onClick={() => setIsEditing(true)}>
							Edit boat
						</Button>
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
};

const formatRigging = ({ rigging }: Pick<Boat, "rigging">) =>
	rigging.charAt(0).toUpperCase() + rigging.slice(1);
