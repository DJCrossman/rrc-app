import { DateTime } from "luxon";
import type { GetGroupByIdInput } from "@/schemas";
import type { ViewerContext } from "@/server/context";
import {
	canSeeGroup,
	getGroupMemberIds,
	getViewerGroups,
} from "@/server/routers/groups/common";
import { TRPCError } from "@/server/trpc";
import { toMetersTimeSeries } from "../../common/to-meters-time-series";

const SERIES_DAYS = 90;

export async function getGroupMetersQuery(
	{ id }: GetGroupByIdInput,
	ctx: ViewerContext,
) {
	const { db } = ctx;
	if (!canSeeGroup(await getViewerGroups(ctx), id)) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
	}
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
