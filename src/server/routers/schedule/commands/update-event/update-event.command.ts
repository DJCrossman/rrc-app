import { TRPCError } from "@trpc/server";
import type { UpdateEventInput } from "@/schemas";
import type { AdminContext } from "@/server/context";
import { updateEventRow } from "@/server/routers/schedule/common/event-writes";
import { mapToEventDtos } from "@/server/routers/schedule/common/map-to-event-dto";
import {
	notifiableEventSelect,
	planChangeNotifications,
	toEventSnapshot,
} from "@/server/routers/schedule/common/schedule-change-notifications";

export async function updateEventCommand(
	{ id, notify, ...input }: UpdateEventInput,
	{ db, athlete }: AdminContext,
) {
	const existing = await db.event.findUnique({
		where: { id },
		select: {
			...notifiableEventSelect,
			workoutId: true,
			_count: { select: { rsvps: { where: { status: "yes" } } } },
		},
	});
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}
	if (input.type !== existing.type) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "An event's type can't be changed",
		});
	}
	const signedUp = existing._count.rsvps;
	if (input.type === "volunteer" && (input.volunteerSpots ?? 0) < signedUp) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `${signedUp} people already signed up for this shift`,
		});
	}

	const row = await db.$transaction((tx) =>
		updateEventRow(tx, id, input, existing.workoutId),
	);
	const [event] = await mapToEventDtos(db, [row], athlete?.id ?? null);
	return {
		event,
		notifications: notify
			? planChangeNotifications(
					[existing],
					new Map([[id, toEventSnapshot(id, input)]]),
				)
			: [],
	};
}
