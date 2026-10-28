import type { EventAudience } from "@/schemas";
import type { Context } from "@/server/context";
import { getMemberIdsByGroup } from "@/server/routers/groups/common";

type AudienceEvent = {
	id: string;
	audience: EventAudience;
	groups: { groupId: string }[];
};

export async function getEventAudiences(
	db: Context["db"],
	events: AudienceEvent[],
): Promise<Map<string, ReadonlySet<string>>> {
	if (events.length === 0) {
		return new Map();
	}
	const groupIds = [
		...new Set(
			events.flatMap((event) =>
				isClubWide(event) ? [] : event.groups.map(({ groupId }) => groupId),
			),
		),
	];
	const [athletes, membersByGroup] = await Promise.all([
		events.some(isClubWide)
			? db.athlete.findMany({ select: { id: true } })
			: [],
		getMemberIdsByGroup(db, groupIds),
	]);
	return resolveEventAudiences(events, {
		everyone: athletes.map(({ id }) => id),
		membersByGroup,
	});
}

// Club events reach every athlete; group events reach the members of their
// groups, each athlete once however many of the groups they're in.
export function resolveEventAudiences(
	events: AudienceEvent[],
	{
		everyone,
		membersByGroup,
	}: {
		everyone: string[];
		membersByGroup: ReadonlyMap<string, string[]>;
	},
): Map<string, ReadonlySet<string>> {
	const club: ReadonlySet<string> = new Set(everyone);
	return new Map(
		events.map((event) => [
			event.id,
			isClubWide(event)
				? club
				: new Set(
						event.groups.flatMap(
							({ groupId }) => membersByGroup.get(groupId) ?? [],
						),
					),
		]),
	);
}

export async function isInEventAudience(
	db: Context["db"],
	event: AudienceEvent,
	athleteId: string,
): Promise<boolean> {
	const audiences = await getEventAudiences(db, [event]);
	return audiences.get(event.id)?.has(athleteId) ?? false;
}

// Matches formatGroupLabel: a group event with no groups left is club-wide.
function isClubWide(event: AudienceEvent) {
	return event.audience === "club" || event.groups.length === 0;
}
