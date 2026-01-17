import { z } from "zod";

const analyticsMetric = z.object({
	amount: z.number(),
	change: z.number(),
});

export const analyticMetricsSchema = z.object({
	totalMeters: analyticsMetric,
	totalActivities: analyticsMetric,
	totalDuration: analyticsMetric,
	activeStreak: z.object({
		currentStreak: z.number(),
		weekDays: z.array(
			z.object({
				date: z.string(),
				hasActivity: z.boolean(),
			}),
		),
	}),
});

export type AnalyticMetrics = z.infer<typeof analyticMetricsSchema>;
