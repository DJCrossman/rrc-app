import { viewerProcedure } from "@/server/procedures";
import { getAnalyticsQuery } from "./get-analytics.query";

export const getAnalyticsProcedure = viewerProcedure.query(({ ctx }) =>
	getAnalyticsQuery(undefined, ctx),
);
