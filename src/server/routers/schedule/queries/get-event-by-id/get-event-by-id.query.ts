import type { GetEventByIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import {
	eventInclude,
	mapToEventDtos,
} from "@/server/routers/schedule/common/map-to-event-dto";

export async function getEventByIdQuery(
	input: GetEventByIdInput,
	{ db, athlete }: ViewerContext,
) {
	const row = await db.event.findUnique({
		where: { id: input.id },
		include: eventInclude,
	});
	if (!row) {
		return null;
	}
	const [event] = await mapToEventDtos(db, [row], athlete?.id ?? null);
	return event;
}
