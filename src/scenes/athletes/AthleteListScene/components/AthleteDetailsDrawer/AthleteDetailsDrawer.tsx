"use client";

import { IconMessage, IconPhone } from "@tabler/icons-react";
import { DateTime, Interval } from "luxon";
import Link from "next/link";
import { useState } from "react";
import { ActivityTable } from "@/components/activities";
import {
	DetailList,
	DetailRow,
	DetailTiles,
	SectionLabel,
} from "@/components/drawer-details";
import { Badge } from "@/components/ui/badge";
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
import { formatRole } from "@/lib/formatters";
import { formatGender } from "@/lib/formatters/formatGender";
import { routes } from "@/lib/routes";
import type { Activities, Athlete } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import type { CreateAthlete, UpdateAthlete } from "@/schemas";
import type { AthleteStats } from "@/schemas/athlete.schema";
import { AthleteForm } from "../AthleteForm/AthleteForm";
import { useMessageMember } from "../useMessageMember";
import { StatCard } from "./StatCard";

interface AthleteDetailsDrawerProps {
	isOpen: boolean;
	athlete: Athlete | null;
	activities: Activities;
	athleteStats: AthleteStats | null;
	canEdit: boolean;
	startEditing: boolean;
	onClose: () => void;
	onSubmit: (data: UpdateAthlete) => Promise<void> | void;
}

export const AthleteDetailsDrawer = ({
	isOpen,
	athlete,
	activities,
	athleteStats,
	canEdit,
	startEditing,
	onClose,
	onSubmit,
}: AthleteDetailsDrawerProps) => {
	const [isEditing, setIsEditing] = useState(startEditing);
	const [lastStartEditing, setLastStartEditing] = useState(startEditing);
	if (startEditing !== lastStartEditing) {
		setLastStartEditing(startEditing);
		setIsEditing(startEditing);
	}
	const { canMessage, message, isPending } = useMessageMember();

	const handleClose = () => {
		setIsEditing(false);
		onClose();
	};

	const handleSubmit = async (data: CreateAthlete) => {
		if (!athlete) return;

		await onSubmit({
			...data,
			id: athlete.id,
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
				<DrawerHeader
					className={cn(
						"flex flex-row items-center gap-3",
						isEditing ? "justify-between border-b" : "justify-end pb-0",
					)}
				>
					<div className={cn("min-w-0", !isEditing && "sr-only")}>
						<DrawerTitle className="truncate text-lg">
							{athlete.name}
						</DrawerTitle>
						<DrawerDescription>
							Member details and activity history
						</DrawerDescription>
					</div>
					<DrawerCloseButton />
				</DrawerHeader>
				<div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6">
					{isEditing ? (
						<AthleteForm
							initialValues={{
								firstName: athlete.firstName,
								lastName: athlete.lastName,
								nickname: athlete.nickname ?? undefined,
								phone: athlete.phone,
								email: athlete.email ?? undefined,
								gender: athlete.gender,
								dateOfBirth: athlete.dateOfBirth,
								dateJoined: athlete.dateJoined ?? undefined,
								heightInCm: athlete.heightInCm ?? undefined,
								weightInKg: athlete.weightInKg ?? undefined,
							}}
							onCancel={() => setIsEditing(false)}
							onSubmit={handleSubmit}
						/>
					) : (
						<>
							<div className="flex flex-col items-center gap-3 text-center">
								<span className="flex size-18 items-center justify-center rounded-full bg-blue-500/10 text-2xl font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
									{[athlete.firstName, athlete.lastName]
										.map((part) => part.charAt(0).toUpperCase())
										.join("")}
								</span>
								<h2 className="text-2xl font-bold tracking-tight">
									{athlete.firstName} {athlete.lastName}
								</h2>
								{athlete.groups.length > 0 && (
									<div className="flex flex-wrap justify-center gap-1.5">
										{athlete.groups.map((group) => (
											<Badge
												key={group.id}
												variant="secondary"
												render={<Link href={routes.groups.view(group.id)} />}
											>
												{group.name}
											</Badge>
										))}
									</div>
								)}
								<div className="flex w-full gap-2.5 pt-1">
									{canMessage(athlete) && (
										<Button
											className="flex-1"
											disabled={isPending}
											onClick={() => message(athlete)}
										>
											<IconMessage />
											Message
										</Button>
									)}
									<Button
										variant="outline"
										className="flex-1"
										render={
											<a href={`tel:${athlete.phone}`}>
												<IconPhone />
												Call
											</a>
										}
									/>
								</div>
							</div>
							<DetailTiles>
								<StatCard
									title="Last 2K"
									stat={athleteStats?.lastTwoKmRaceDuration ?? null}
									distance={2000}
								/>
								<StatCard
									title="Best 2K"
									stat={athleteStats?.bestTwoKmRaceDuration ?? null}
									distance={2000}
								/>
								<StatCard
									title="Last 6K"
									stat={athleteStats?.lastSixKmRaceDuration ?? null}
									distance={6000}
								/>
								<StatCard
									title="Best 6K"
									stat={athleteStats?.bestSixKmRaceDuration ?? null}
									distance={6000}
								/>
							</DetailTiles>
							<DetailList>
								<DetailRow label="Role">{formatRole(athlete.role)}</DetailRow>
								<DetailRow label="Phone">
									<a
										href={`tel:${athlete.phone}`}
										className="text-blue-600 hover:underline dark:text-blue-400"
									>
										{athlete.phone}
									</a>
								</DetailRow>
								{athlete.email && (
									<DetailRow label="Email">{athlete.email}</DetailRow>
								)}
								<DetailRow label="Age">
									{Math.floor(
										DateTime.now()
											.diff(DateTime.fromISO(athlete.dateOfBirth), "years")
											.toObject().years || 0,
									)}
								</DetailRow>
								<DetailRow label="Gender">{formatGender(athlete)}</DetailRow>
								<DetailRow label="Date Joined">
									{athlete.dateJoined
										? DateTime.fromISO(athlete.dateJoined).toLocaleString({
												month: "short",
												year: "numeric",
											})
										: "N/A"}
								</DetailRow>
								{(athlete.heightInCm || athlete.weightInKg) && (
									<DetailRow label="Height / Weight">
										{[
											athlete.heightInCm && `${athlete.heightInCm} cm`,
											athlete.weightInKg && `${athlete.weightInKg} kg`,
										]
											.filter(Boolean)
											.join(" · ")}
									</DetailRow>
								)}
							</DetailList>
							<div className="space-y-3">
								<SectionLabel>RCA memberships</SectionLabel>
								{athlete.memberships && athlete.memberships.length > 0 ? (
									<ul className="flex flex-col gap-2">
										{athlete.memberships.map((m) => (
											<li
												key={m.id}
												className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-[15px]"
											>
												<span className="min-w-0 truncate font-medium">
													{m.name}
												</span>
												<span className="shrink-0 text-[13px] text-muted-foreground">
													{m.startDate && m.endDate
														? Interval.fromDateTimes(
																DateTime.fromISO(m.startDate),
																DateTime.fromISO(m.endDate),
															).toLocaleString({ month: "short" })
														: "—"}
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-muted-foreground">No programs.</p>
								)}
							</div>
							<div className="space-y-3">
								<SectionLabel>Activities</SectionLabel>
								<div className="overflow-x-auto">
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
							</div>
						</>
					)}
				</div>
				{!isEditing && canEdit && (
					<DrawerFooter className="flex-row border-t">
						<Button className="flex-1" onClick={() => setIsEditing(true)}>
							Edit member
						</Button>
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
};
