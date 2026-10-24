import type { RsvpInput } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { setRsvp } from "@/server/routers/schedule/common/set-rsvp";

export async function rsvpCommand(
	{ eventId, status }: RsvpInput,
	{ db, athlete }: AuthenticatedContext,
) {
	const existing = await db.event_rsvp.findUnique({
		where: { eventId_athleteId: { eventId, athleteId: athlete.id } },
		select: { status: true },
	});
	return setRsvp(db, {
		eventId,
		athleteId: athlete.id,
		status: status === existing?.status ? null : status,
	});
}
