import { unauthenticatedProcedure } from "@/server/common/procedures/unauthenticated.procedure";
import { getCurrentUserQuery } from "./get-current-user.query";

export const getCurrentUserProcedure = unauthenticatedProcedure.query(
	({ ctx }) => getCurrentUserQuery(undefined, ctx),
);
