import { getLeaderboardInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getLeaderboardQuery } from "./get-leaderboard.query";

export const getLeaderboardProcedure = viewerProcedure
	.input(getLeaderboardInputSchema)
	.query(({ ctx, input }) => getLeaderboardQuery(input, ctx));
