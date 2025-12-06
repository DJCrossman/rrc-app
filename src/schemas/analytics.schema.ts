import { z } from "zod";

const analyticsMetric = z.object({
	amount: z.number(),
	change: z.number(),
});

export const analyticMetricsSchema = z.object({
	totalMeters: analyticsMetric,
	totalWorkouts: analyticsMetric,
	totalPoints: analyticsMetric,
	attendance: analyticsMetric,
});

export type AnalyticMetrics = z.infer<typeof analyticMetricsSchema>;
