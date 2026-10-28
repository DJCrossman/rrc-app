import { DateTime } from "luxon";
import type { Prisma } from "@/generated/prisma/client";
import {
	EVENT_TYPE_LABELS,
	formatEventTime,
	formatGroupLabel,
} from "@/lib/schedule/event-labels";
import type { Context, ViewerContext } from "@/server/context";
import { canSeeGroup, type ViewerGroups } from "@/server/routers/groups/common";
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
		groupNames,
		viewer,
	}: {
		athleteId: string | null;
		audienceIds: ReadonlySet<string>;
		groupNames?: ReadonlyMap<string, string>;
		/** Names only the groups this viewer can see in the group label. */
		viewer?: ViewerGroups;
	},
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
		groupLabel: formatGroupLabel(
			event.audience,
			viewer ? groupIds.filter((id) => canSeeGroup(viewer, id)) : groupIds,
			groupNames,
		),
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
	viewer?: ViewerGroups,
) {
	const [audiences, groupNames] = await Promise.all([
		getEventAudiences(db, events),
		findGroupNames(
			db,
			events.flatMap((event) => event.groups.map(({ groupId }) => groupId)),
		),
	]);
	return events.map((event) =>
		mapToEventDto(event, {
			athleteId,
			audienceIds: audiences.get(event.id) ?? new Set(),
			groupNames,
			viewer,
		}),
	);
}

// Admins see every event; everyone else sees club events and their groups'.
export async function mapToVisibleEventDtos(
	{ db, athlete }: ViewerContext,
	events: EventRow[],
	viewer: ViewerGroups,
) {
	const dtos = await mapToEventDtos(db, events, athlete?.id ?? null, viewer);
	return viewer.isAdmin ? dtos : dtos.filter((event) => event.inAudience);
}

export async function findGroupNames(
	db: Context["db"],
	groupIds: string[],
): Promise<ReadonlyMap<string, string>> {
	if (groupIds.length === 0) {
		return new Map();
	}
	const groups = await db.group.findMany({
		where: { id: { in: [...new Set(groupIds)] } },
		select: { id: true, name: true },
	});
	return new Map(groups.map((group) => [group.id, group.name]));
}
