import { TRPCError } from "@trpc/server";
import type { EventIdInput } from "@/schemas";
import type { AdminContext } from "@/server/context";
import { getEventAudiences } from "@/server/routers/schedule/common/event-audience";
import { sendNudge } from "@/server/routers/schedule/common/send-nudge";

export async function nudgeCommand(
	{ eventId }: EventIdInput,
	{ db, services }: AdminContext,
) {
	if (!services.push.isConfigured) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Push notifications are not configured on the server.",
		});
	}
	const event = await db.event.findUnique({
		where: { id: eventId },
		include: {
			groups: { select: { groupId: true } },
			rsvps: { select: { athleteId: true } },
		},
	});
	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}
	const audience = (await getEventAudiences(db, [event])).get(event.id) ?? [];
	const responded = new Set(event.rsvps.map(({ athleteId }) => athleteId));
	const athleteIds = [...audience].filter((id) => !responded.has(id));

	const { reached } = await sendNudge(services.push, { event, athleteIds });
	return { count: athleteIds.length, reached };
}
