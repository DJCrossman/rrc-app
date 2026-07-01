import { protectedProcedure } from "@/server/procedures";
import { getLeaderboardQuery } from "./get-leaderboard.query";

export const getLeaderboardProcedure = protectedProcedure.query(({ ctx }) =>
	getLeaderboardQuery(undefined, ctx),
);
