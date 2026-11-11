import { z } from "zod";
import { paginate } from "@/lib/pagination";
import { ActivityType, WorkoutType, withPagination } from "@/schemas";
import type { Context } from "@/server/context";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";
import { isErgTest } from "@/server/routers/analytics/common/is-erg-test";

export const getActivitiesInputSchema = withPagination({
	columns: ["startDate", "name", "type"] as const,
}).extend({
	boatId: z.string().optional(),
	athleteId: z.string().optional(),
	athleteIds: z.array(z.string()).optional(),
	ergId: z.string().optional(),
	type: z.enum(ActivityType).optional(),
	workoutType: z.enum(WorkoutType).optional(),
	ergTest: z.enum(["2k", "6k"]).optional(),
});
export type GetActivitiesInput = z.infer<typeof getActivitiesInputSchema>;

export async function getActivitiesQuery(
	input: GetActivitiesInput,
	{ db }: Context,
) {
	const {
		boatId,
		athleteId,
		athleteIds,
		ergId,
		type,
		workoutType,
		ergTest,
		sortBy,
		order,
		page,
		pageSize = 20,
	} = input;

	const where = {
		...(boatId ? { boatId, type: "water" as const } : {}),
		...(athleteId ? { athleteId } : {}),
		...(athleteIds?.length ? { athleteId: { in: athleteIds } } : {}),
		...(ergId ? { ergId, type: "erg" as const } : {}),
		...(type ? { type } : {}),
		...(workoutType ? { workoutType } : {}),
	};

	const ergTestDistance = ergTest && { "2k": 2000, "6k": 6000 }[ergTest];
	const ergTestIds = ergTestDistance
		? (
				await db.activity.findMany({
					where: { ...where, type: "erg", distance: ergTestDistance },
					select: {
						id: true,
						type: true,
						distance: true,
						conceptTwoData: true,
					},
				})
			)
				.filter((activity) => isErgTest(activity, ergTestDistance))
				.map((activity) => activity.id)
		: undefined;
	const pagedWhere = {
		...where,
		...(ergTestIds ? { id: { in: ergTestIds } } : {}),
	};

	const [rows, totalCount] = await Promise.all([
		db.activity.findMany({
			where: pagedWhere,
			include: activityInclude,
			orderBy: { [sortBy ?? "startDate"]: order ?? "desc" },
			take: pageSize,
			skip: ((page ?? 1) - 1) * pageSize,
		}),
		db.activity.count({ where: pagedWhere }),
	]);

	return paginate({
		data: rows.map(mapToActivityDto),
		totalCount,
		page,
		pageSize,
	});
}
