import { router } from "@/server/trpc";
import { getAnalyticsProcedure } from "./queries/get-analytics/get-analytics.procedure";
import { getLeaderboardProcedure } from "./queries/get-leaderboard/get-leaderboard.procedure";

export const analyticsRouter = router({
	getAnalytics: getAnalyticsProcedure,
	getLeaderboard: getLeaderboardProcedure,
});
