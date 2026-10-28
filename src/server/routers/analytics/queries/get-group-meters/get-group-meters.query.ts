import { DateTime } from "luxon";
import type { GetGroupByIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import { getGroupMemberIds } from "@/server/routers/groups/common";
import { toMetersTimeSeries } from "../../common/to-meters-time-series";

const SERIES_DAYS = 90;

export async function getGroupMetersQuery(
	{ id }: GetGroupByIdInput,
	{ db }: ViewerContext,
) {
	const athleteIds = await getGroupMemberIds(db, id);
	const rows = athleteIds.length
		? await db.activity.findMany({
				where: {
					athleteId: { in: athleteIds },
					startDate: {
						gte: DateTime.now()
							.minus({ days: SERIES_DAYS })
							.startOf("day")
							.toJSDate(),
					},
				},
				select: { startDate: true, type: true, distance: true },
				orderBy: { startDate: "asc" },
			})
		: [];
	return { metersTimeSeries: toMetersTimeSeries(rows) };
}
