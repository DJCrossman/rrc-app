import { viewerProcedure } from "@/server/procedures";
import { getLeaderboardQuery } from "./get-leaderboard.query";

export const getLeaderboardProcedure = viewerProcedure.query(({ ctx }) =>
	getLeaderboardQuery(undefined, ctx),
);
