import type { UpdateActivity } from "@/schemas";
import type { Context } from "@/server/context";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";

export async function updateActivityCommand(
	input: UpdateActivity,
	{ db }: Context,
) {
	const row = await db.activity.update({
		where: { id: input.id },
		data: {
			name: input.name,
			startDate: new Date(input.startDate),
			timezone: input.timezone,
			workoutType: input.workoutType,
			elapsedTime: input.elapsedTime,
			distance: input.distance,
			athleteId: input.athleteId,
			workoutId: input.workoutId ?? null,
			type: input.type,
			...(input.type === "water"
				? { boatId: input.boatId, ergId: null }
				: { ergId: input.ergId, boatId: null }),
		},
		include: activityInclude,
	});
	return mapToActivityDto(row);
}
