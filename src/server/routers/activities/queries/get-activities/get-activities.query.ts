import type { GetActivitiesInput } from "@/schemas";
import type { Context } from "@/server/context";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";

export async function getActivitiesQuery(
	input: GetActivitiesInput,
	{ db }: Context,
) {
	const { boatId, athleteId, ergId } = input;
	const rows = await db.activity.findMany({
		where: {
			...(boatId ? { boatId, type: "water" as const } : {}),
			...(athleteId ? { athleteId } : {}),
			...(ergId ? { ergId, type: "erg" as const } : {}),
		},
		include: activityInclude,
		orderBy: { startDate: "desc" },
	});
	return { data: rows.map(mapToActivityDto) };
}
