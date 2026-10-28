"use client";

import { IconCalendarShare, IconPlus, IconTable } from "@tabler/icons-react";

import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes, type ScheduleRoutes } from "@/lib/routes";
import { countNotifiable } from "@/lib/schedule/changes";
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
import { formatNudgeResult } from "./utils/formatNudgeResult";

const TYPE_FILTERS = [
	{ value: "all", label: "All" },
	{ value: "training", label: "Training" },
	{ value: "regatta", label: "Regattas" },
	{ value: "volunteer", label: "Volunteer" },
] satisfies { value: ScheduleTypeFilter; label: string }[];

export interface ScheduleViewProps {
	schedule: ScheduleWeek;
	filters: { type: ScheduleTypeFilter; group?: string };
	selectedEvent: ScheduleEvent | null;
	responses: EventResponses | null;
	analytics: Pick<AnalyticMetrics, "lastTwoKm" | "lastSixKm"> | null;
	isCreateDrawerOpen: boolean;
}

interface IProps extends ScheduleViewProps {
	title?: ReactNode;
	scheduleRoutes: ScheduleRoutes;
	/** Groups to filter by; leave out to lock the view to one group. */
	groups?: { id: string; name: string }[];
}

export const ScheduleView = ({
	schedule,
	filters,
	selectedEvent,
	responses,
	analytics,
	isCreateDrawerOpen,
	title,
	scheduleRoutes,
	groups,
}: IProps) => {
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
	const closeOverlay = () => navigate(scheduleRoutes.list(routeParams));

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex items-center justify-between gap-2 p-4 lg:px-6">
						{title ?? <span />}
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
								<Button asChild variant="outline" size="sm">
									<a
										href={routes.schedule.bulkEditTraining({
											week: weekStart,
										})}
									>
										<IconTable />
										<span className="hidden sm:inline">Bulk edit training</span>
									</a>
								</Button>
							)}
							{isAdmin && (
								<Button
									type="button"
									size="sm"
									onClick={() => navigate(scheduleRoutes.create(routeParams))}
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
										scheduleRoutes.list({
											...routeParams,
											week: weekStart.minus({ weeks: 1 }),
										}),
									)
								}
								onNext={() =>
									navigate(
										scheduleRoutes.list({
											...routeParams,
											week: weekStart.plus({ weeks: 1 }),
										}),
									)
								}
								onThisWeek={() =>
									navigate(
										scheduleRoutes.list({ ...routeParams, week: undefined }),
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
												scheduleRoutes.list({ ...routeParams, type: value }),
											)
										}
									>
										{label}
									</FilterChip>
								))}
							</div>
						</div>
						{groups && groups.length > 0 && (
							<div className="flex flex-wrap gap-2">
								<FilterChip
									isActive={!filters.group}
									onClick={() =>
										navigate(
											scheduleRoutes.list({
												...routeParams,
												group: undefined,
											}),
										)
									}
								>
									All groups
								</FilterChip>
								{groups.map((group) => (
									<FilterChip
										key={group.id}
										isActive={filters.group === group.id}
										onClick={() =>
											navigate(
												scheduleRoutes.list({
													...routeParams,
													group: group.id,
												}),
											)
										}
									>
										{group.name}
									</FilterChip>
								))}
							</div>
						)}
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
											viewHref={scheduleRoutes.view({
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
			<EventCreateDrawer
				isOpen={isCreateDrawerOpen && isAdmin}
				defaultDate={defaultDay}
				onClose={closeOverlay}
				onSubmit={async (input) => {
					const event = await withErrorToast(createEvent.mutateAsync(input));
					toast.success("Event created");
					navigate(
						scheduleRoutes.list({
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
				notifyCount={selectedEvent ? countNotifiable(selectedEvent) : 0}
				onClose={closeOverlay}
				onSubmit={async (input, { notify }) => {
					if (!selectedEvent) return;
					await withErrorToast(
						updateEvent.mutateAsync({ ...input, id: selectedEvent.id, notify }),
					);
					toast.success("Event updated");
					router.refresh();
				}}
				onDelete={async (eventId, { notify }) => {
					await withErrorToast(
						deleteEvent.mutateAsync({ id: eventId, notify }),
					);
					toast.success("Event deleted");
					closeOverlay();
					router.refresh();
				}}
			/>
			<NudgeDialog
				event={nudgeEvent}
				onClose={() => setNudgeEvent(null)}
				onConfirm={async (eventId) => {
					const { count, reached } = await withErrorToast(
						nudge.mutateAsync({ eventId }),
					);
					toast.success(formatNudgeResult(count, reached));
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
		</>
	);
};
