import { DateTime } from "luxon";
import { CLUB_TIMEZONE, getClubToday } from "@/lib/schedule/week";
import type { GetUpcomingInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import { getViewerGroups } from "@/server/routers/groups/common";
import {
	eventInclude,
	mapToVisibleEventDtos,
} from "@/server/routers/schedule/common/map-to-event-dto";

const UPCOMING_SCAN_LIMIT = 200;

export async function getUpcomingQuery(
	{ limit, groupId }: GetUpcomingInput,
	ctx: ViewerContext,
) {
	const { db } = ctx;
	const viewer = await getViewerGroups(ctx);
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
	const events = (await mapToVisibleEventDtos(ctx, rows, viewer)).filter(
		(event) =>
			// On a group's page, admins outside the group still see its events.
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
