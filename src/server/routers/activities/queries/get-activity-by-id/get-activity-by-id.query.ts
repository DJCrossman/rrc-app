import type { GetActivityByIdInput } from "@/schemas";
import type { Context } from "@/server/context";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";

export async function getActivityByIdQuery(
	input: GetActivityByIdInput,
	{ db }: Context,
) {
	if (!input.id) return null;
	const row = await db.activity.findUnique({
		where: { id: input.id },
		include: activityInclude,
	});
	return row ? mapToActivityDto(row) : null;
}
