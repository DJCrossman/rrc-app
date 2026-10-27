import { viewerProcedure } from "@/server/procedures";
import { getMyGroupsQuery } from "./get-my-groups.query";

export const getMyGroupsProcedure = viewerProcedure.query(({ ctx }) =>
	getMyGroupsQuery(undefined, ctx),
);
