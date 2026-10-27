import { paginate } from "@/lib/pagination";
import { viewerProcedure } from "@/server/procedures";
import { getPendingInboxBatchesQuery } from "./get-pending-inbox-batches.query";

export const getPendingInboxBatchesProcedure = viewerProcedure.query(
	({ ctx }) =>
		ctx.athlete
			? getPendingInboxBatchesQuery(undefined, { ...ctx, athlete: ctx.athlete })
			: NO_PENDING_BATCHES,
);

type PendingInboxBatches = Awaited<
	ReturnType<typeof getPendingInboxBatchesQuery>
>;

const NO_PENDING_BATCHES: PendingInboxBatches = {
	...paginate({ data: [], totalCount: 0 }),
	latestBySource: { strava: null, concept2: null },
};
