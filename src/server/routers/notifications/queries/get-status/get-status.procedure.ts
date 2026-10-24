import { protectedProcedure } from "@/server/procedures";
import { getStatusQuery } from "./get-status.query";

export const getStatusProcedure = protectedProcedure.query(({ ctx }) =>
	getStatusQuery(undefined, ctx),
);
