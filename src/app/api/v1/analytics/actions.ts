"use server";
import { requireAuth } from "@/lib/auth";
import {
	analyticMetricsSchema,
	leaderboardSchema,
	metersTimeSeriesSchema,
} from "@/schemas";
import analyticMetrics from "./analyticMetrics.json";
import leaderboard from "./leaderboard.json";
import metersTimeSeries from "./meters-time-series.json";

export const getAnalytics = async () => {
	await requireAuth();

	return {
		analyticMetrics: analyticMetricsSchema.parse(analyticMetrics),
		metersTimeSeries: metersTimeSeriesSchema.parse(metersTimeSeries),
		leaderboard: leaderboardSchema.parse(leaderboard),
	};
};
