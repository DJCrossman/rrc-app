import { viewerProcedure } from "@/server/procedures";
import { getGroupsQuery } from "./get-groups.query";

export const getGroupsProcedure = viewerProcedure.query(({ ctx }) =>
	getGroupsQuery(undefined, ctx),
);
