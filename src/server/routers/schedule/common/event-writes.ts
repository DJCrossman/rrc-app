import type { Prisma } from "@/generated/prisma/client";
import type { CreateEvent } from "@/schemas";
import {
	toEventData,
	toEventGroups,
	toWorkoutData,
} from "@/server/routers/schedule/common/event-data";
import { eventInclude } from "@/server/routers/schedule/common/map-to-event-dto";
import { toZoneRows } from "@/server/routers/workouts/common/zone-minutes-write";

export async function createEventRow(
	tx: Prisma.TransactionClient,
	input: CreateEvent,
	createdById: string | null,
) {
	const workout =
		input.type === "training" && input.workout
			? await tx.workout.create({
					data: {
						...toWorkoutData(input.workout, input.startAt),
						fragments: { create: input.workout.fragments ?? [] },
						zoneMinutes: { create: toZoneRows(input.workout.zoneMinutes) },
					},
				})
			: null;
	return tx.event.create({
		data: {
			...toEventData(input),
			workoutId: workout?.id ?? null,
			createdById,
			groups: { create: toEventGroups(input) },
		},
		include: eventInclude,
	});
}

export async function updateEventRow(
	tx: Prisma.TransactionClient,
	id: string,
	input: CreateEvent,
	existingWorkoutId: string | null,
) {
	let workoutId = existingWorkoutId;
	if (input.type === "training" && input.workout) {
		const data = toWorkoutData(input.workout, input.startAt);
		const fragments = input.workout.fragments ?? [];
		const zoneRows = toZoneRows(input.workout.zoneMinutes);
		workoutId = workoutId
			? (
					await tx.workout.update({
						where: { id: workoutId },
						data: {
							...data,
							fragments: { deleteMany: {}, create: fragments },
							// The schedule's event form doesn't edit composition, so an
							// update without it must leave the existing breakdown alone.
							...(input.workout.zoneMinutes && {
								zoneMinutes: { deleteMany: {}, create: zoneRows },
							}),
						},
					})
				).id
			: (
					await tx.workout.create({
						data: {
							...data,
							fragments: { create: fragments },
							zoneMinutes: { create: zoneRows },
						},
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
}
