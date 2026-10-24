import { DateTime } from "luxon";
import type { Prisma } from "@/generated/prisma/client";
import {
	EVENT_TYPE_LABELS,
	formatEventTime,
	formatGroupLabel,
} from "@/lib/schedule/event-labels";
import type { Context } from "@/server/context";
import {
	mapToWorkoutDto,
	workoutInclude,
} from "@/server/routers/workouts/common/map-to-workout-dto";
import { countResponses } from "./count-responses";
import { getEventAudiences } from "./event-audience";

export const eventInclude = {
	workout: { include: workoutInclude },
	groups: { select: { groupId: true } },
	rsvps: { select: { athleteId: true, status: true } },
} as const;

export type EventRow = Prisma.eventGetPayload<{
	include: typeof eventInclude;
}>;

export const mapToEventDto = (
	event: EventRow,
	{
		athleteId,
		audienceIds,
	}: { athleteId: string | null; audienceIds: ReadonlySet<string> },
) => {
	const groupIds = event.groups.map(({ groupId }) => groupId);
	const inAudience = athleteId !== null && audienceIds.has(athleteId);
	const myRsvp =
		event.rsvps.find((rsvp) => rsvp.athleteId === athleteId)?.status ?? null;
	const counts = countResponses(event.rsvps, audienceIds);
	const start = DateTime.fromJSDate(event.startAt, { zone: event.timezone });
	return {
		id: event.id,
		type: event.type,
		typeLabel: EVENT_TYPE_LABELS[event.type],
		title: event.title,
		description: event.description,
		startAt: event.startAt.toISOString(),
		endAt: event.endAt?.toISOString() ?? null,
		allDay: event.allDay,
		timezone: event.timezone,
		date: start.toISODate() ?? "",
		timeLabel: formatEventTime(event),
		location: event.location,
		workout: event.workout ? mapToWorkoutDto(event.workout) : null,
		audience: event.audience,
		groupIds,
		groupLabel: formatGroupLabel(event.audience, groupIds),
		volunteerSpots: event.volunteerSpots,
		myRsvp,
		counts,
		volunteer:
			event.type === "volunteer"
				? {
						filled: counts.going,
						spots: event.volunteerSpots ?? 0,
						signedUp: myRsvp === "yes",
					}
				: null,
		canRsvp: inAudience,
		inAudience,
	};
};

export async function mapToEventDtos(
	db: Context["db"],
	events: EventRow[],
	athleteId: string | null,
) {
	const audiences = await getEventAudiences(db, events);
	return events.map((event) =>
		mapToEventDto(event, {
			athleteId,
			audienceIds: audiences.get(event.id) ?? new Set(),
		}),
	);
}
