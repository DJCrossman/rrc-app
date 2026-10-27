import { updateEventInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { sendAfterResponse } from "@/server/routers/schedule/common/schedule-change-notifications";
import { updateEventCommand } from "./update-event.command";

export const updateEventProcedure = adminProcedure
	.input(updateEventInputSchema)
	.mutation(async ({ ctx, input }) => {
		const { event, notifications } = await updateEventCommand(input, ctx);
		sendAfterResponse(ctx.services.push, notifications);
		return event;
	});
