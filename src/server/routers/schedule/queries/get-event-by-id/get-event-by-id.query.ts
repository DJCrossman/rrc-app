import type { GetEventByIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import { getViewerGroups } from "@/server/routers/groups/common";
import {
	eventInclude,
	mapToVisibleEventDtos,
} from "@/server/routers/schedule/common/map-to-event-dto";

export async function getEventByIdQuery(
	input: GetEventByIdInput,
	ctx: ViewerContext,
) {
	const { db } = ctx;
	const row = await db.event.findUnique({
		where: { id: input.id },
		include: eventInclude,
	});
	if (!row) {
		return null;
	}
	const [event] = await mapToVisibleEventDtos(
		ctx,
		[row],
		await getViewerGroups(ctx),
	);
	return event ?? null;
}
