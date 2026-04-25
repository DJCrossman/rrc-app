import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { protectedProcedure } from "@/server/procedures";
import { processStravaInboxBatchCommand } from "./process-strava-inbox-batch.command";

const logger = createLogger("inbox.processor.strava");

const inputSchema = z.object({ batchId: z.string() });

export const processStravaInboxBatchProcedure = protectedProcedure
	.input(inputSchema)
	.mutation({
		handler: ({ ctx, input }) => processStravaInboxBatchCommand(input, ctx),
		finalize: async ({ ctx, input, result }) => {
			if (result.status !== "rejected") return;
			const message =
				result.reason instanceof Error
					? result.reason.message
					: String(result.reason);
			logger.error("batch failed", { batchId: input.batchId, error: message });
			await ctx.db.activity_inbox.update({
				where: { id: input.batchId },
				data: {
					status: "failed",
					completedAt: new Date(),
					errorMessage: message,
				},
			});
		},
	});
