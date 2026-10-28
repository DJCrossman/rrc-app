import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { parseWeekStart, startOfWeek } from "@/lib/schedule/week";
import { ScheduleTypeFilters } from "@/schemas";
import type { createServerCaller } from "@/server/caller";

export const scheduleQuerySchema = z.object({
	week: z.string().optional(),
	type: z.enum(ScheduleTypeFilters).catch("all"),
	group: z.string().optional(),
	eventId: z.string().optional(),
	action: z.literal("create").optional().catch(undefined),
});

type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;

export async function loadSchedulePage(
	caller: Awaited<ReturnType<typeof createServerCaller>>,
	{ week, type, group, eventId, action }: ScheduleQuery,
) {
	const selectedEvent = eventId
		? await caller.schedule.getEventById({ id: eventId })
		: null;
	const weekStart =
		!week && selectedEvent
			? startOfWeek(
					DateTime.fromISO(selectedEvent.startAt, {
						zone: selectedEvent.timezone,
					}) as DateTime<true>,
				)
			: parseWeekStart(week);

	const [schedule, responses, analytics] = await Promise.all([
		caller.schedule.getWeek({
			weekStart: weekStart.toISODate(),
			type: type === "all" ? undefined : type,
			groupId: group,
		}),
		selectedEvent
			? caller.schedule.getResponses({ eventId: selectedEvent.id })
			: null,
		selectedEvent?.workout?.fragments.length
			? caller.analytics
					.getAnalytics()
					.then(({ analyticMetrics }) => analyticMetrics)
					.catch((error: unknown) => {
						if (error instanceof TRPCError && error.code === "FORBIDDEN") {
							return null;
						}
						throw error;
					})
			: null,
	]);

	return {
		schedule,
		filters: { type, group },
		selectedEvent,
		responses,
		analytics,
		isCreateDrawerOpen: action === "create",
	};
}
