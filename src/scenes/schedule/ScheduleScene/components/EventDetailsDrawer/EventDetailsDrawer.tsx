"use client";

import {
	IconCalendarEvent,
	IconMapPin,
	IconPencil,
	IconTrash,
	IconUsersGroup,
	IconX,
} from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	formatCompactSplit,
	formatDuration,
	formatMeters,
} from "@/lib/formatters";
import { getMapsSearchUrl } from "@/lib/maps";
import { formatEventDate } from "@/lib/schedule/event-labels";
import type {
	AnalyticMetrics,
	EventResponses,
	ScheduleEvent,
} from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import type { CreateEvent } from "@/schemas";
import { intensityColorMap } from "../../utils/intensityColorMap";
import { EventDetailsForm } from "../EventDetailsForm/EventDetailsForm";
import { EventResponsesList } from "../EventResponsesList/EventResponsesList";
import { EventTypeBadge } from "../EventTypeBadge/EventTypeBadge";
import { EventWorkoutForm } from "../EventWorkoutForm/EventWorkoutForm";
import { FragmentSplitDisplay } from "../FragmentSplitDisplay";

interface EventDetailsDrawerProps {
	event: ScheduleEvent | null;
	responses: EventResponses | null;
	analytics: Pick<AnalyticMetrics, "lastTwoKm" | "lastSixKm"> | null;
	isAdmin: boolean;
	onClose: () => void;
	onSubmit: (input: CreateEvent) => Promise<void>;
	onDelete: (eventId: string) => Promise<void>;
}

export const EventDetailsDrawer = ({
	event,
	responses,
	analytics,
	isAdmin,
	onClose,
	onSubmit,
	onDelete,
}: EventDetailsDrawerProps) => {
	const [editing, setEditing] = useState<"details" | "workout" | null>(null);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	if (!event) {
		return null;
	}

	const { workout } = event;

	return (
		<Drawer open onOpenChange={(open) => !open && onClose()} direction="right">
			<DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
				<DrawerHeader className="flex flex-row items-center justify-between gap-3 border-b">
					<div className="flex min-w-0 items-center gap-3">
						<DrawerTitle className="truncate">{event.title}</DrawerTitle>
						<EventTypeBadge type={event.type} label={event.typeLabel} />
					</div>
					<DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
						<IconX className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DrawerClose>
				</DrawerHeader>
				<div className="flex-1 space-y-8 overflow-y-auto p-6">
					{isAdmin && !editing && (
						<div className="flex items-center justify-end gap-2">
							{isConfirmingDelete ? (
								<>
									<span className="mr-auto text-sm">
										Delete this event{workout && " and its workout"}?
									</span>
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
												await onDelete(event.id);
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
									Delete event
								</Button>
							)}
						</div>
					)}
					<section className="space-y-4">
						<SectionHeader
							title="Details"
							canEdit={isAdmin && !editing}
							onEdit={() => setEditing("details")}
						/>
						{editing === "details" ? (
							<EventDetailsForm
								event={event}
								onSubmit={async (input) => {
									await onSubmit(input);
									setEditing(null);
								}}
								onCancel={() => setEditing(null)}
							/>
						) : (
							<dl className="space-y-4">
								<DetailRow icon={IconCalendarEvent} label="When">
									{formatEventDate(event.startAt, event.timezone)} ·{" "}
									{event.timeLabel}
								</DetailRow>
								{event.location && (
									<DetailRow icon={IconMapPin} label="Location">
										<a
											href={getMapsSearchUrl(event.location)}
											target="_blank"
											rel="noreferrer"
											className="hover:underline"
										>
											{event.location}
										</a>
									</DetailRow>
								)}
								<DetailRow icon={IconUsersGroup} label="Who">
									{event.groupLabel}
									{event.volunteer &&
										` · ${event.volunteer.filled} / ${event.volunteer.spots} filled`}
								</DetailRow>
								{event.description && (
									<div>
										<dt className="text-xs text-muted-foreground">Notes</dt>
										<dd className="text-sm whitespace-pre-line">
											{event.description}
										</dd>
									</div>
								)}
							</dl>
						)}
					</section>
					{workout && (
						<section className="space-y-3">
							<SectionHeader
								title="Workout"
								canEdit={isAdmin && !editing}
								onEdit={() => setEditing("workout")}
							>
								<Badge
									className={cn(
										"border-transparent",
										intensityColorMap[workout.intensityCategory],
									)}
								>
									{workout.intensityCategory}
								</Badge>
								<Badge variant="outline">
									{workout.activityType === "water" ? "On Water" : "Erg"}
								</Badge>
							</SectionHeader>
							{editing === "workout" ? (
								<EventWorkoutForm
									event={event}
									onSubmit={async (input) => {
										await onSubmit(input);
										setEditing(null);
									}}
									onCancel={() => setEditing(null)}
								/>
							) : (
								<>
									<p className="text-sm">
										{workout.description
											.split(";")
											.map((line) => line.trim())
											.filter(Boolean)
											.map((line) => (
												<span key={line} className="block">
													{line}
												</span>
											))}
									</p>
									{(workout.elapsedTime || workout.distance) && (
										<p className="text-sm text-muted-foreground">
											{[
												workout.elapsedTime &&
													formatDuration(workout.elapsedTime),
												workout.distance && formatMeters(workout.distance),
											]
												.filter(Boolean)
												.join(" · ")}
										</p>
									)}
									{workout.fragments.length > 0 && (
										<div className="space-y-3">
											<div className="flex gap-4 text-xs text-muted-foreground">
												{analytics?.lastTwoKm && (
													<span>
														2K baseline{" "}
														<span className="font-mono">
															{formatCompactSplit(
																analytics.lastTwoKm.duration,
																2000,
															)}
															/500m
														</span>
													</span>
												)}
												{analytics?.lastSixKm && (
													<span>
														6K baseline{" "}
														<span className="font-mono">
															{formatCompactSplit(
																analytics.lastSixKm.duration,
																6000,
															)}
															/500m
														</span>
													</span>
												)}
											</div>
											{workout.fragments.map((fragment) => (
												<FragmentSplitDisplay
													key={fragment.id}
													fragment={fragment}
													lastTwoKm={analytics?.lastTwoKm}
													lastSixKm={analytics?.lastSixKm}
												/>
											))}
										</div>
									)}
								</>
							)}
						</section>
					)}
					{responses && !editing && (
						<section className="space-y-3">
							<SectionHeader title="Responses" />
							<EventResponsesList type={event.type} responses={responses} />
						</section>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
};

const SectionHeader = ({
	title,
	canEdit = false,
	onEdit,
	children,
}: {
	title: string;
	canEdit?: boolean;
	onEdit?: () => void;
	children?: React.ReactNode;
}) => (
	<div className="flex items-center gap-2">
		<h3 className="text-sm font-semibold">{title}</h3>
		{children}
		{canEdit && (
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="ml-auto"
				onClick={onEdit}
			>
				<IconPencil />
				Edit
			</Button>
		)}
	</div>
);

const DetailRow = ({
	icon: Icon,
	label,
	children,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	children: React.ReactNode;
}) => (
	<div className="flex gap-3">
		<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
		<div className="min-w-0">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="text-sm">{children}</dd>
		</div>
	</div>
);
