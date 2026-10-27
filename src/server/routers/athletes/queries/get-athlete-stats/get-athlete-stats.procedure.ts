import { getAthleteStatsInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getAthleteStatsQuery } from "./get-athlete-stats.query";

export const getAthleteStatsProcedure = viewerProcedure
	.input(getAthleteStatsInputSchema)
	.query(({ ctx, input }) => getAthleteStatsQuery(input, ctx));
