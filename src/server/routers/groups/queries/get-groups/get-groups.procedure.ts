import { protectedProcedure } from "@/server/procedures";
import { getGroupsQuery } from "./get-groups.query";

export const getGroupsProcedure = protectedProcedure.query(({ ctx }) =>
	getGroupsQuery(undefined, ctx),
);
