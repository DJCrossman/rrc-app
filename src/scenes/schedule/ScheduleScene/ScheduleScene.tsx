"use client";

import { IconCalendarShare, IconPlus } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import {
	CLUB_TIMEZONE,
	formatWeekRange,
	startOfWeek,
} from "@/lib/schedule/week";
import { withErrorToast } from "@/lib/toast";
import { trpcClient } from "@/lib/trpc/client";
import type {
	AnalyticMetrics,
	EventResponses,
	ScheduleEvent,
	ScheduleWeek,
} from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import type { ScheduleTypeFilter } from "@/schemas";
import {
	DayRow,
	EventCard,
	EventCreateDrawer,
	EventDetailsDrawer,
	FilterChip,
	MobileDayStrip,
	NudgeDialog,
	SubscribeDialog,
	WeekNavigation,
} from "./components";

const TYPE_FILTERS = [
	{ value: "all", label: "All" },
	{ value: "training", label: "Training" },
	{ value: "regatta", label: "Regattas" },
	{ value: "volunteer", label: "Volunteer" },
] satisfies { value: ScheduleTypeFilter; label: string }[];

interface ScheduleSceneProps {
	schedule: ScheduleWeek;
	filters: { type: ScheduleTypeFilter; group?: string };
	selectedEvent: ScheduleEvent | null;
	responses: EventResponses | null;
	analytics: Pick<AnalyticMetrics, "lastTwoKm" | "lastSixKm"> | null;
	isCreateDrawerOpen: boolean;
}

export const ScheduleScene = ({
	schedule,
	filters,
	selectedEvent,
	responses,
	analytics,
	isCreateDrawerOpen,
}: ScheduleSceneProps) => {
	const router = useRouter();
	const { isAdmin, hasAthlete } = useCurrentUser();
	const [isNavigating, startNavigation] = useTransition();
	const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
	const [nudgeEvent, setNudgeEvent] = useState<ScheduleEvent | null>(null);
	const defaultDay =
		schedule.days.find((day) => day.isToday)?.date ?? schedule.weekStart;
	const [selectedDay, setSelectedDay] = useState({
		weekStart: schedule.weekStart,
		date: defaultDay,
	});

	const rsvp = trpcClient.schedule.rsvp.useMutation();
	const nudge = trpcClient.schedule.nudge.useMutation();
	const createEvent = trpcClient.schedule.createEvent.useMutation();
	const updateEvent = trpcClient.schedule.updateEvent.useMutation();
	const deleteEvent = trpcClient.schedule.deleteEvent.useMutation();
	const calendarToken = trpcClient.schedule.getCalendarToken.useMutation({
		onError: (error) => toast.error(error.message),
	});
	const rotateCalendarToken =
		trpcClient.schedule.rotateCalendarToken.useMutation({
			onSuccess: () => toast.success("Your old calendar link stopped working"),
			onError: (error) => toast.error(error.message),
		});

	const weekStart = DateTime.fromISO(schedule.weekStart, {
		zone: CLUB_TIMEZONE,
	}) as DateTime<true>;
	const routeParams = {
		week: weekStart,
		type: filters.type,
		group: filters.group,
	};
	const activeDay =
		selectedDay.weekStart === schedule.weekStart
			? selectedDay.date
			: defaultDay;

	const navigate = (url: string) =>
		startNavigation(() => router.push(url, { scroll: false }));
	const closeOverlay = () => navigate(routes.schedule.list(routeParams));

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader breadcrumbs={[{ label: "Schedule" }]} />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex items-center justify-between gap-2 p-4 lg:px-6">
							<Heading as="h1">Schedule</Heading>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setIsSubscribeOpen(true);
										if (!calendarToken.data && !calendarToken.isPending) {
											calendarToken.mutate();
										}
									}}
								>
									<IconCalendarShare />
									<span className="hidden sm:inline">Subscribe</span>
								</Button>
								{isAdmin && (
									<Button
										type="button"
										size="sm"
										onClick={() =>
											navigate(routes.schedule.create(routeParams))
										}
									>
										<IconPlus />
										<span className="hidden sm:inline">New event</span>
									</Button>
								)}
							</div>
						</div>
						<div className="flex flex-col gap-3 px-4 lg:px-6">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<WeekNavigation
									label={formatWeekRange(weekStart)}
									isCurrentWeek={schedule.days.some((day) => day.isToday)}
									onPrevious={() =>
										navigate(
											routes.schedule.list({
												...routeParams,
												week: weekStart.minus({ weeks: 1 }),
											}),
										)
									}
									onNext={() =>
										navigate(
											routes.schedule.list({
												...routeParams,
												week: weekStart.plus({ weeks: 1 }),
											}),
										)
									}
									onThisWeek={() =>
										navigate(
											routes.schedule.list({ ...routeParams, week: undefined }),
										)
									}
								/>
								<div className="flex flex-wrap gap-2">
									{TYPE_FILTERS.map(({ value, label }) => (
										<FilterChip
											key={value}
											isActive={filters.type === value}
											onClick={() =>
												navigate(
													routes.schedule.list({ ...routeParams, type: value }),
												)
											}
										>
											{label}
										</FilterChip>
									))}
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<FilterChip
									isActive={!filters.group}
									onClick={() =>
										navigate(
											routes.schedule.list({
												...routeParams,
												group: undefined,
											}),
										)
									}
								>
									All groups
								</FilterChip>
								{filters.group && (
									<FilterChip isActive>{filters.group}</FilterChip>
								)}
							</div>
						</div>
						<div
							className={cn(
								"flex flex-col gap-2 px-4 pb-6 transition-opacity lg:px-6",
								isNavigating && "opacity-60",
							)}
						>
							<MobileDayStrip
								days={schedule.days}
								selectedDate={activeDay}
								onSelect={(date) =>
									setSelectedDay({ weekStart: schedule.weekStart, date })
								}
							/>
							<div className="flex flex-col">
								{schedule.days.map((day) => (
									<DayRow
										key={day.date}
										day={day}
										isSelected={day.date === activeDay}
									>
										{day.events.map((event) => (
											<EventCard
												key={event.id}
												event={event}
												isAdmin={isAdmin}
												viewHref={routes.schedule.view({
													...routeParams,
													id: event.id,
												})}
												onRsvp={async (eventId, status) => {
													const result = await withErrorToast(
														rsvp.mutateAsync({ eventId, status }),
													);
													router.refresh();
													return result.status;
												}}
												onNudge={setNudgeEvent}
											/>
										))}
									</DayRow>
								))}
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
			<EventCreateDrawer
				isOpen={isCreateDrawerOpen && isAdmin}
				defaultDate={defaultDay}
				onClose={closeOverlay}
				onSubmit={async (input) => {
					const event = await withErrorToast(createEvent.mutateAsync(input));
					toast.success("Event created");
					navigate(
						routes.schedule.list({
							...routeParams,
							week: startOfWeek(
								DateTime.fromISO(event.startAt, {
									zone: event.timezone,
								}) as DateTime<true>,
							),
						}),
					);
					router.refresh();
				}}
			/>
			<EventDetailsDrawer
				key={selectedEvent?.id}
				event={selectedEvent}
				responses={responses}
				analytics={analytics}
				isAdmin={isAdmin}
				onClose={closeOverlay}
				onSubmit={async (input) => {
					if (!selectedEvent) return;
					await withErrorToast(
						updateEvent.mutateAsync({ ...input, id: selectedEvent.id }),
					);
					toast.success("Event updated");
					router.refresh();
				}}
				onDelete={async (eventId) => {
					await withErrorToast(deleteEvent.mutateAsync({ id: eventId }));
					toast.success("Event deleted");
					closeOverlay();
					router.refresh();
				}}
			/>
			<NudgeDialog
				event={nudgeEvent}
				onClose={() => setNudgeEvent(null)}
				onConfirm={async (eventId) => {
					const { count } = await withErrorToast(
						nudge.mutateAsync({ eventId }),
					);
					toast.success(
						`Reminder sent to ${count} ${count === 1 ? "person" : "people"}`,
					);
				}}
			/>
			<SubscribeDialog
				isOpen={isSubscribeOpen}
				token={
					rotateCalendarToken.data?.token ?? calendarToken.data?.token ?? null
				}
				isResetting={rotateCalendarToken.isPending}
				canReply={hasAthlete}
				onReset={() => rotateCalendarToken.mutate()}
				onClose={() => setIsSubscribeOpen(false)}
			/>
		</SidebarProvider>
	);
};
