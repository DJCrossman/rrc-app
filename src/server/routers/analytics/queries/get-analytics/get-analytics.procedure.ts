import { protectedProcedure } from "@/server/procedures";
import { getAnalyticsQuery } from "./get-analytics.query";

export const getAnalyticsProcedure = protectedProcedure.query(({ ctx }) =>
	getAnalyticsQuery(undefined, ctx),
);
