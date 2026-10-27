import { viewerProcedure } from "@/server/procedures";
import { getMembersQuery } from "./get-members.query";

export const getMembersProcedure = viewerProcedure.query(({ ctx }) =>
	getMembersQuery(undefined, ctx),
);
