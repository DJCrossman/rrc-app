import { protectedProcedure } from "@/server/procedures";
import { getPendingInboxBatchesQuery } from "./get-pending-inbox-batches.query";

export const getPendingInboxBatchesProcedure = protectedProcedure.query(
	({ ctx }) => getPendingInboxBatchesQuery(undefined, ctx),
);
