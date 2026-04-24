import { router } from "@/server/trpc";
import { getAnalyticsProcedure } from "./queries/get-analytics/get-analytics.procedure";

export const analyticsRouter = router({
	getAnalytics: getAnalyticsProcedure,
});
