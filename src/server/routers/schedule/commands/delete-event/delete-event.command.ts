import { TRPCError } from "@trpc/server";
import type { DeleteEventInput } from "@/schemas";
import type { AdminContext } from "@/server/context";
import {
	notifiableEventSelect,
	planChangeNotifications,
} from "@/server/routers/schedule/common/schedule-change-notifications";

export async function deleteEventCommand(
	{ id, notify }: DeleteEventInput,
	{ db }: AdminContext,
) {
	const event = await db.event.findUnique({
		where: { id },
		select: { ...notifiableEventSelect, workoutId: true },
	});
	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}
	await db.$transaction(async (tx) => {
		await tx.event.delete({ where: { id } });
		if (event.workoutId) {
			await tx.workout.delete({ where: { id: event.workoutId } });
		}
	});
	return {
		id,
		notifications: notify
			? planChangeNotifications([event], new Map([[id, null]]))
			: [],
	};
}
