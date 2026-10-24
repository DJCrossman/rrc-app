import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { parseWeekStart, startOfWeek } from "@/lib/schedule/week";
import { ScheduleScene } from "@/scenes/schedule";
import { ScheduleTypeFilters } from "@/schemas";
import { createServerCaller } from "@/server/caller";

const querySchema = z.object({
	week: z.string().optional(),
	type: z.enum(ScheduleTypeFilters).catch("all"),
	group: z.string().optional(),
	eventId: z.string().optional(),
	action: z.literal("create").optional().catch(undefined),
});

export default async function SchedulePage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { week, type, group, eventId, action } = querySchema.parse(
		await searchParams,
	);
	const caller = await createServerCaller();
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

	return (
		<ScheduleScene
			schedule={schedule}
			filters={{ type, group }}
			selectedEvent={selectedEvent}
			responses={responses}
			analytics={analytics}
			isCreateDrawerOpen={action === "create"}
		/>
	);
}
