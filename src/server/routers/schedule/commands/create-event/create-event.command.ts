import type { CreateEvent } from "@/schemas";
import type { AdminContext } from "@/server/context";
import { createEventRow } from "@/server/routers/schedule/common/event-writes";
import { mapToEventDtos } from "@/server/routers/schedule/common/map-to-event-dto";

export async function createEventCommand(
	input: CreateEvent,
	{ db, athlete }: AdminContext,
) {
	const row = await db.$transaction((tx) =>
		createEventRow(tx, input, athlete?.id ?? null),
	);
	const [event] = await mapToEventDtos(db, [row], athlete?.id ?? null);
	return event;
}
