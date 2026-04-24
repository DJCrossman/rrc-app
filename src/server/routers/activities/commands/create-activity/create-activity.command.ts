import type { CreateActivity } from "@/schemas";
import type { Context } from "@/server/context";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";

export async function createActivityCommand(
	input: CreateActivity,
	{ db }: Context,
) {
	const row = await db.activity.create({
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
				? { boatId: input.boatId }
				: { ergId: input.ergId }),
		},
		include: activityInclude,
	});
	return mapToActivityDto(row);
}
