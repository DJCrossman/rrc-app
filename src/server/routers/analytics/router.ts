import { router } from "@/server/trpc";
import { getAnalyticsProcedure } from "./queries/get-analytics/get-analytics.procedure";
import { getGroupMetersProcedure } from "./queries/get-group-meters/get-group-meters.procedure";
import { getLeaderboardProcedure } from "./queries/get-leaderboard/get-leaderboard.procedure";

export const analyticsRouter = router({
	getAnalytics: getAnalyticsProcedure,
	getLeaderboard: getLeaderboardProcedure,
	getGroupMeters: getGroupMetersProcedure,
});
