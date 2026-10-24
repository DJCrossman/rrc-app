import type { EventAudience } from "@/schemas";
import type { Context } from "@/server/context";

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
	// Until groups land in wave 2, every athlete is in every event's audience,
	// including group events; wave 2 resolves groups via getGroupMemberIds.
	const athletes = await db.athlete.findMany({ select: { id: true } });
	const everyone: ReadonlySet<string> = new Set(athletes.map(({ id }) => id));
	return new Map(events.map((event) => [event.id, everyone]));
}

export async function isInEventAudience(
	db: Context["db"],
	event: AudienceEvent,
	athleteId: string,
): Promise<boolean> {
	const audiences = await getEventAudiences(db, [event]);
	return audiences.get(event.id)?.has(athleteId) ?? false;
}
