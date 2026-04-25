import { protectedProcedure } from "@/server/procedures";
import { syncConcept2ActivitiesCommand } from "./sync-concept2-activities.command";
import { syncConcept2ActivitiesFinalizeCallback } from "./sync-concept2-activities.finalize";

export const syncConcept2ActivitiesProcedure = protectedProcedure.mutation({
	handler: ({ ctx }) => syncConcept2ActivitiesCommand(undefined, ctx),
	finalize: syncConcept2ActivitiesFinalizeCallback,
});
