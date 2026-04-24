import { protectedProcedure } from "@/server/procedures";
import { getBoatsQuery } from "./get-boats.query";

export const getBoatsProcedure = protectedProcedure.query(({ ctx }) =>
	getBoatsQuery(undefined, ctx),
);
