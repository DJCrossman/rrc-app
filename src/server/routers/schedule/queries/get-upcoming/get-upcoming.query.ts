import { DateTime } from "luxon";
import { CLUB_TIMEZONE, getClubToday } from "@/lib/schedule/week";
import type { GetUpcomingInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import {
	eventInclude,
	mapToEventDtos,
} from "@/server/routers/schedule/common/map-to-event-dto";

const UPCOMING_SCAN_LIMIT = 200;

export async function getUpcomingQuery(
	{ limit, groupId }: GetUpcomingInput,
	{ db, athlete }: ViewerContext,
) {
	const now = DateTime.now();
	const rows = await db.event.findMany({
		where: {
			OR: [
				{
					startAt: {
						gte: now.setZone(CLUB_TIMEZONE).startOf("day").toJSDate(),
					},
				},
				{ endAt: { gte: now.toJSDate() } },
			],
			...(groupId && {
				AND: {
					OR: [{ audience: "club" }, { groups: { some: { groupId } } }],
				},
			}),
		},
		include: eventInclude,
		orderBy: { startAt: "asc" },
		take: UPCOMING_SCAN_LIMIT,
	});
	const today = getClubToday(now);
	const events = (await mapToEventDtos(db, rows, athlete?.id ?? null)).filter(
		(event) =>
			// A group's page shows the group's events to anyone looking at it.
			(groupId || event.inAudience) &&
			(event.allDay
				? event.date >= today
				: new Date(event.endAt ?? event.startAt) >= now.toJSDate()),
	);

	return {
		next: events
			.filter(
				(event) => event.type !== "volunteer" || event.volunteer?.signedUp,
			)
			.slice(0, limit),
		pendingRsvps: events
			.filter(
				(event) => event.type !== "volunteer" && event.canRsvp && !event.myRsvp,
			)
			.slice(0, limit),
		volunteerShifts: events
			.filter((event) => event.type === "volunteer")
			.slice(0, limit),
		nextTraining: events.find((event) => event.type === "training") ?? null,
	};
}
