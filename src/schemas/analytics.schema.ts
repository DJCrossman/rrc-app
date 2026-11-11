import { z } from "zod";

export const AnalyticsPeriods = [
	"three_months",
	"thirty_days",
	"seven_days",
] as const;

export type AnalyticsPeriod = (typeof AnalyticsPeriods)[number];

export const AnalyticsPeriodDays: Record<AnalyticsPeriod, number> = {
	three_months: 90,
	thirty_days: 30,
	seven_days: 7,
};

export const getLeaderboardInputSchema = z.object({
	period: z.enum(AnalyticsPeriods),
});

export type GetLeaderboardInput = z.infer<typeof getLeaderboardInputSchema>;
