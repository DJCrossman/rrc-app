import { protectedProcedure } from "@/server/procedures";
import { getMyGroupsQuery } from "./get-my-groups.query";

export const getMyGroupsProcedure = protectedProcedure.query(({ ctx }) =>
	getMyGroupsQuery(undefined, ctx),
);
