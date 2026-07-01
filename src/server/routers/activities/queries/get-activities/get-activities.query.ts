import { z } from "zod";
import { paginate } from "@/lib/pagination";
import { ActivityType, WorkoutType, withPagination } from "@/schemas";
import type { Context } from "@/server/context";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";

export const getActivitiesInputSchema = withPagination({
	columns: ["startDate", "name", "type"] as const,
}).extend({
	boatId: z.string().optional(),
	athleteId: z.string().optional(),
	ergId: z.string().optional(),
	type: z.enum(ActivityType).optional(),
	workoutType: z.enum(WorkoutType).optional(),
});
export type GetActivitiesInput = z.infer<typeof getActivitiesInputSchema>;

export async function getActivitiesQuery(
	input: GetActivitiesInput,
	{ db }: Context,
) {
	const {
		boatId,
		athleteId,
		ergId,
		type,
		workoutType,
		sortBy,
		order,
		page,
		pageSize = 20,
	} = input;

	const where = {
		...(boatId ? { boatId, type: "water" as const } : {}),
		...(athleteId ? { athleteId } : {}),
		...(ergId ? { ergId, type: "erg" as const } : {}),
		...(type ? { type } : {}),
		...(workoutType ? { workoutType } : {}),
	};

	const [rows, totalCount] = await Promise.all([
		db.activity.findMany({
			where,
			include: activityInclude,
			orderBy: { [sortBy ?? "startDate"]: order ?? "desc" },
			take: pageSize,
			skip: ((page ?? 1) - 1) * pageSize,
		}),
		db.activity.count({ where }),
	]);

	return paginate({
		data: rows.map(mapToActivityDto),
		totalCount,
		page,
		pageSize,
	});
}
