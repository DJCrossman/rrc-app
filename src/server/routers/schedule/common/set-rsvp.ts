import { TRPCError } from "@trpc/server";
import type { RsvpStatus } from "@/schemas";
import type { Context } from "@/server/context";
import { isInEventAudience } from "./event-audience";

export async function setRsvp(
	db: Context["db"],
	{
		eventId,
		athleteId,
		status,
	}: { eventId: string; athleteId: string; status: RsvpStatus | null },
) {
	return db.$transaction(async (tx) => {
		await tx.$queryRaw`SELECT "id" FROM "event" WHERE "id" = ${eventId} FOR UPDATE`;
		const event = await tx.event.findUnique({
			where: { id: eventId },
			include: {
				groups: { select: { groupId: true } },
				rsvps: { where: { status: "yes" }, select: { athleteId: true } },
			},
		});
		if (!event) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
		}
		if (!(await isInEventAudience(db, event, athleteId))) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "This event isn't open to you",
			});
		}
		if (status === null) {
			await tx.event_rsvp.deleteMany({ where: { eventId, athleteId } });
			return { eventId, status };
		}
		if (event.type === "volunteer") {
			if (status !== "yes") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Volunteer shifts only take sign-ups",
				});
			}
			const others = event.rsvps.filter((rsvp) => rsvp.athleteId !== athleteId);
			if (others.length >= (event.volunteerSpots ?? 0)) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This shift is full",
				});
			}
		}
		await tx.event_rsvp.upsert({
			where: { eventId_athleteId: { eventId, athleteId } },
			create: { eventId, athleteId, status },
			update: { status },
		});
		return { eventId, status };
	});
}
