import {
	bucketByDay,
	getClubToday,
	getWeekDays,
	parseWeekStart,
} from "@/lib/schedule/week";
import type { GetWeekInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import {
	eventInclude,
	mapToEventDtos,
} from "@/server/routers/schedule/common/map-to-event-dto";

export async function getWeekQuery(
	input: GetWeekInput,
	{ db, athlete }: ViewerContext,
) {
	const weekStart = parseWeekStart(input.weekStart);
	const rows = await db.event.findMany({
		where: {
			startAt: {
				gte: weekStart.minus({ days: 1 }).toJSDate(),
				lt: weekStart.plus({ days: 8 }).toJSDate(),
			},
			type: input.type,
			...(input.groupId && {
				OR: [
					{ audience: "club" },
					{ groups: { some: { groupId: input.groupId } } },
				],
			}),
		},
		include: eventInclude,
		orderBy: [{ allDay: "desc" }, { startAt: "asc" }],
	});
	const events = await mapToEventDtos(db, rows, athlete?.id ?? null);
	const today = getClubToday();

	return {
		weekStart: weekStart.toISODate(),
		days: bucketByDay(getWeekDays(weekStart), events, ({ date }) => date).map(
			({ date, items }) => ({ date, isToday: date === today, events: items }),
		),
	};
}
