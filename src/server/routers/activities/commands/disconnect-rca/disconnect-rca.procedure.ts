import { protectedProcedure } from "@/server/procedures";
import { disconnectRcaCommand } from "./disconnect-rca.command";

export const disconnectRcaProcedure = protectedProcedure.mutation(({ ctx }) =>
	disconnectRcaCommand(undefined, ctx),
);
