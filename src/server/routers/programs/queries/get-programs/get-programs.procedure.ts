import { protectedProcedure } from "@/server/procedures";
import { getProgramsQuery } from "./get-programs.query";

export const getProgramsProcedure = protectedProcedure.query(({ ctx }) =>
	getProgramsQuery(undefined, ctx),
);
