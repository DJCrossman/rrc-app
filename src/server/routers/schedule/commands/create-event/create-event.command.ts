import type { CreateEvent } from "@/schemas";
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

export async function createEventCommand(
	input: CreateEvent,
	{ db, athlete }: AdminContext,
) {
	const row = await db.$transaction(async (tx) => {
		const workout =
			input.type === "training" && input.workout
				? await tx.workout.create({
						data: {
							...toWorkoutData(input.workout, input.startAt),
							fragments: { create: input.workout.fragments ?? [] },
						},
					})
				: null;
		return tx.event.create({
			data: {
				...toEventData(input),
				workoutId: workout?.id ?? null,
				createdById: athlete?.id ?? null,
				groups: { create: toEventGroups(input) },
			},
			include: eventInclude,
		});
	});
	const [event] = await mapToEventDtos(db, [row], athlete?.id ?? null);
	return event;
}
