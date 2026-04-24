import { getAthleteStatsInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getAthleteStatsQuery } from "./get-athlete-stats.query";

export const getAthleteStatsProcedure = protectedProcedure
	.input(getAthleteStatsInputSchema)
	.query(({ ctx, input }) => getAthleteStatsQuery(input, ctx));
