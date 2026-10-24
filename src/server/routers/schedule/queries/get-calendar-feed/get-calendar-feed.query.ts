import { DateTime } from "luxon";
import type { Context } from "@/server/context";
import { formatCalendarReplyText } from "@/server/routers/schedule/common/calendar-reply";
import { getEventAudiences } from "@/server/routers/schedule/common/event-audience";
import {
	formatICalendar,
	type ICalEvent,
} from "@/server/routers/schedule/common/ical";
import { resolveCalendarViewer } from "@/server/routers/schedule/common/resolve-calendar-viewer";

const FEED_HISTORY_DAYS = 90;

export async function getCalendarFeedQuery(
	{ token, origin }: { token: string; origin: string },
	{ db }: Pick<Context, "db">,
) {
	const viewer = await resolveCalendarViewer(db, token);
	if (!viewer) {
		return null;
	}
	const { athleteId } = viewer;
	const rows = await db.event.findMany({
		where: {
			startAt: {
				gte: DateTime.now().minus({ days: FEED_HISTORY_DAYS }).toJSDate(),
			},
		},
		include: {
			workout: { select: { description: true } },
			groups: { select: { groupId: true } },
			rsvps: {
				where: { athleteId: athleteId ?? "" },
				select: { status: true },
			},
		},
		orderBy: { startAt: "asc" },
	});
	const audiences = await getEventAudiences(db, rows);

	return formatICalendar({
		name: "Regina Rowing Club",
		events: rows
			.filter((event) => !athleteId || audiences.get(event.id)?.has(athleteId))
			.map(
				(event): ICalEvent => ({
					uid: `${event.id}@rrc-app`,
					start: event.startAt,
					end: event.endAt,
					allDay: event.allDay,
					timezone: event.timezone,
					summary: event.title,
					location: event.location,
					description: [
						event.workout && `Workout: ${event.workout.description}`,
						event.description,
						athleteId &&
							formatCalendarReplyText({
								replyUrl: `${origin}/api/v1/calendar/${token}/rsvp/${event.id}`,
								type: event.type,
								status: event.rsvps[0]?.status ?? null,
							}),
					]
						.filter(Boolean)
						.join("\n\n"),
					url: `${origin}/schedule?eventId=${event.id}`,
					lastModified: event.updatedAt,
				}),
			),
	});
}
