import { viewerProcedure } from "@/server/procedures";
import { rotateCalendarTokenCommand } from "./rotate-calendar-token.command";

export const rotateCalendarTokenProcedure = viewerProcedure.mutation(
	({ ctx }) => rotateCalendarTokenCommand(undefined, ctx),
);
