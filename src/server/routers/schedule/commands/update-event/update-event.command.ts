import { TRPCError } from "@trpc/server";
import type { UpdateEvent } from "@/schemas";
import type { AdminContext } from "@/server/context";
import {
	toEventData,
	toEventGroups,
	toWorkoutData,
} from "@/server/routers/schedule/common/event-data";
import {
	eventInclude,
	mapToEventDtos,
} from "@/server/routers/schedule/common/map-to-event-dto";

export async function updateEventCommand(
	{ id, ...input }: UpdateEvent,
	{ db, athlete }: AdminContext,
) {
	const existing = await db.event.findUnique({
		where: { id },
		select: {
			type: true,
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

	const row = await db.$transaction(async (tx) => {
		let workoutId = existing.workoutId;
		if (input.type === "training" && input.workout) {
			const data = toWorkoutData(input.workout, input.startAt);
			const fragments = input.workout.fragments ?? [];
			workoutId = workoutId
				? (
						await tx.workout.update({
							where: { id: workoutId },
							data: {
								...data,
								fragments: { deleteMany: {}, create: fragments },
							},
						})
					).id
				: (
						await tx.workout.create({
							data: { ...data, fragments: { create: fragments } },
						})
					).id;
		}
		return tx.event.update({
			where: { id },
			data: {
				...toEventData(input),
				workoutId,
				groups: { deleteMany: {}, create: toEventGroups(input) },
			},
			include: eventInclude,
		});
	});
	const [event] = await mapToEventDtos(db, [row], athlete?.id ?? null);
	return event;
}
