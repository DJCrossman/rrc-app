import { protectedProcedure } from "@/server/procedures";
import { syncRcaCommand } from "./sync-rca.command";

export const syncRcaProcedure = protectedProcedure.mutation(({ ctx }) =>
	syncRcaCommand(undefined, ctx),
);
