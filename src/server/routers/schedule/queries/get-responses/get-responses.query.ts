import { TRPCError } from "@trpc/server";
import {
	EVENT_TYPE_LABELS,
	formatEventDate,
	formatEventTime,
	formatGroupLabel,
} from "@/lib/schedule/event-labels";
import type { EventIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import {
	type AthleteRow,
	athleteInclude,
	mapToAthleteDto,
} from "@/server/routers/athletes/common/map-to-athlete-dto";
import { countResponses } from "@/server/routers/schedule/common/count-responses";
import { getEventAudiences } from "@/server/routers/schedule/common/event-audience";
import { eventInclude } from "@/server/routers/schedule/common/map-to-event-dto";

export async function getResponsesQuery(
	{ eventId }: EventIdInput,
	{ db }: ViewerContext,
) {
	const event = await db.event.findUnique({
		where: { id: eventId },
		include: eventInclude,
	});
	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}
	const audienceIds = (await getEventAudiences(db, [event])).get(event.id);
	const audience: ReadonlySet<string> = audienceIds ?? new Set();
	const statusByAthlete = new Map(
		event.rsvps.map(({ athleteId, status }) => [athleteId, status]),
	);
	const athletes = await db.athlete.findMany({
		where: {
			id: { in: [...new Set([...audience, ...statusByAthlete.keys()])] },
		},
		include: athleteInclude,
		orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
	});
	const people = athletes.map(mapToResponsePerson);
	const groupIds = event.groups.map(({ groupId }) => groupId);

	return {
		event: {
			id: event.id,
			title: event.title,
			typeLabel: EVENT_TYPE_LABELS[event.type],
			dateLabel: formatEventDate(event.startAt, event.timezone),
			timeLabel: formatEventTime(event),
			groupLabel: formatGroupLabel(event.audience, groupIds),
		},
		counts: countResponses(event.rsvps, audience),
		going: people.filter((p) => statusByAthlete.get(p.athleteId) === "yes"),
		maybe: people.filter((p) => statusByAthlete.get(p.athleteId) === "maybe"),
		no: people.filter((p) => statusByAthlete.get(p.athleteId) === "no"),
		noReply: people.filter(
			(p) => !statusByAthlete.has(p.athleteId) && audience.has(p.athleteId),
		),
	};
}

function mapToResponsePerson(row: AthleteRow) {
	const athlete = mapToAthleteDto(row);
	return {
		athleteId: athlete.id,
		name: `${athlete.name} ${athlete.lastName}`,
		initials:
			`${athlete.name.charAt(0)}${athlete.lastName.charAt(0)}`.toUpperCase(),
		program: athlete.activeMembership?.name ?? null,
	};
}
