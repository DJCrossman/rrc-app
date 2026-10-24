import { viewerProcedure } from "@/server/procedures";
import { getCalendarTokenCommand } from "./get-calendar-token.command";

export const getCalendarTokenProcedure = viewerProcedure.mutation(({ ctx }) =>
	getCalendarTokenCommand(undefined, ctx),
);
