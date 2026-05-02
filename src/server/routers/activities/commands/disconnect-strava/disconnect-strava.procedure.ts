import { protectedProcedure } from "@/server/procedures";
import { disconnectStravaCommand } from "./disconnect-strava.command";

export const disconnectStravaProcedure = protectedProcedure.mutation(
	({ ctx }) => disconnectStravaCommand(undefined, ctx),
);
