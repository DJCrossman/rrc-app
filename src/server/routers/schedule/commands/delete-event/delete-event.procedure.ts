import { deleteEventInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { sendAfterResponse } from "@/server/routers/schedule/common/schedule-change-notifications";
import { deleteEventCommand } from "./delete-event.command";

export const deleteEventProcedure = adminProcedure
	.input(deleteEventInputSchema)
	.mutation(async ({ ctx, input }) => {
		const { notifications, ...result } = await deleteEventCommand(input, ctx);
		sendAfterResponse(ctx.services.push, notifications);
		return result;
	});
