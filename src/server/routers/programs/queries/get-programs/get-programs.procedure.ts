import { viewerProcedure } from "@/server/procedures";
import { getProgramsQuery } from "./get-programs.query";

export const getProgramsProcedure = viewerProcedure.query(({ ctx }) =>
	getProgramsQuery(undefined, ctx),
);
