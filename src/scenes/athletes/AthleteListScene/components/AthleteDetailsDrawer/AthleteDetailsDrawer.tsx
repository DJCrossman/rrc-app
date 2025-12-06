"use client";

import { IconPencil, IconX } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { ActivityTable } from "@/components/activities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { formatProgram, formatRole } from "@/lib/formatters";
import { formatGender } from "@/lib/formatters/formatGender";
import type { Activities, Athlete, CreateAthlete } from "@/schemas";
import { AthleteForm } from "../AthleteForm/AthleteForm";

interface AthleteDetailsDrawerProps {
	isOpen: boolean;
	athlete: Athlete | null;
	activities: Activities;
	onClose: () => void;
	onSubmit: (data: Athlete) => Promise<void> | void;
}

export const AthleteDetailsDrawer = ({
	isOpen,
	athlete,
	activities,
	onClose,
	onSubmit,
}: AthleteDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleClose = () => {
		setIsEditing(false);
		onClose();
	};

	const handleSubmit = async (data: CreateAthlete) => {
		if (!athlete) return;

		await onSubmit({
			...athlete,
			...data,
		});
		setIsEditing(false);
	};

	if (!athlete) {
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
						<DrawerTitle>{athlete.name}</DrawerTitle>
						<DrawerDescription>
							Athlete details and activity history
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
						<AthleteForm
							initialValues={athlete}
							onCancel={() => setIsEditing(false)}
							onSubmit={handleSubmit}
						/>
					) : (
						<>
							{/* Athlete Details Section */}
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
								<div className="space-y-4">
									<div>
										<strong>Phone:</strong>{" "}
										<a
											href={`tel:${athlete.phone}`}
											className="text-blue-600 hover:underline"
										>
											{athlete.phone}
										</a>
									</div>
									<div>
										<strong>Roles:</strong>{" "}
										{athlete.roles.map((role) => (
											<Badge key={role} variant="outline" className="mr-2">
												{formatRole(role)}
											</Badge>
										))}
									</div>
									<div>
										<strong>Age:</strong>{" "}
										{Math.floor(
											DateTime.now()
												.diff(DateTime.fromISO(athlete.dateOfBirth), "years")
												.toObject().years || 0,
										)}
									</div>
									<div>
										<strong>Gender:</strong> {formatGender(athlete)}
									</div>
									<div>
										<strong>Active Membership:</strong>
										<br />
										{athlete?.activeMembership?.name || "None"}
										{athlete.programType && (
											<Badge variant="outline" className="ml-2">
												{formatProgram(athlete.programType)}
											</Badge>
										)}
									</div>
									<div>
										<strong>Joined:</strong>
										<br />
										{!athlete.dateJoined
											? "N/A"
											: DateTime.fromISO(athlete.dateJoined).toLocaleString(
													DateTime.DATE_FULL,
												)}
									</div>
								</div>
							</div>

							{/* Activities Section */}
							<div className="space-y-4">
								<ActivityTable
									data={activities}
									showColumns={[
										"startDate",
										"name",
										"boat.name",
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
