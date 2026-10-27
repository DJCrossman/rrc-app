import { saveTrainingWeekSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { sendAfterResponse } from "@/server/routers/schedule/common/schedule-change-notifications";
import { saveTrainingWeekCommand } from "./save-training-week.command";

export const saveTrainingWeekProcedure = adminProcedure
	.input(saveTrainingWeekSchema)
	.mutation(async ({ ctx, input }) => {
		const { notifications, ...result } = await saveTrainingWeekCommand(
			input,
			ctx,
		);
		sendAfterResponse(ctx.services.push, notifications);
		return result;
	});
