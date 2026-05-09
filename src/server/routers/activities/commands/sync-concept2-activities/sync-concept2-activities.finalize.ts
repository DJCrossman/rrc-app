import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";
import type { FinalizeCallback } from "@/server/procedures";
import { getConcept2AccessToken } from "../../common/get-concept2-access-token";
import { processConcept2InboxBatchCommand } from "../process-concept2-inbox-batch/process-concept2-inbox-batch.command";
import type { syncConcept2ActivitiesCommand } from "./sync-concept2-activities.command";

const logger = createLogger("sync.concept2");

function raiseGatewayError(err: unknown): never {
	const message = err instanceof Error ? err.message : String(err);
	logger.error("upstream fetch failed", { error: message });
	throw new TRPCError({ code: "BAD_GATEWAY", message });
}

export const syncConcept2ActivitiesFinalizeCallback: FinalizeCallback<
	AuthenticatedContext,
	undefined,
	Awaited<ReturnType<typeof syncConcept2ActivitiesCommand>>
> = async ({ ctx, result }) => {
	if (result.status !== "fulfilled") return;
	const { batchId } = result.value;
	const { db, services } = ctx;
	try {
		const accessToken = await getConcept2AccessToken(ctx);
		if (!accessToken) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Concept2 is not connected. Please reconnect.",
			});
		}
		const [ergResults, waterResults] = await Promise.allSettled([
			services.concept2
				.fetchAllResults("rower", accessToken)
				.catch(raiseGatewayError),
			services.concept2
				.fetchAllResults("water", accessToken)
				.catch(raiseGatewayError),
		]);

		if (ergResults.status === "rejected") {
			const message =
				ergResults.status === "rejected"
					? ergResults.reason instanceof Error
						? ergResults.reason.message
						: String(ergResults.reason)
					: "Unknown error";
			logger.error("upstream fetch failed", { error: message });
			throw new TRPCError({ code: "BAD_GATEWAY", message });
		}

		if (waterResults.status === "rejected") {
			const message =
				waterResults.status === "rejected"
					? waterResults.reason instanceof Error
						? waterResults.reason.message
						: String(waterResults.reason)
					: "Unknown error";
			logger.error("upstream fetch failed", { error: message });
			throw new TRPCError({ code: "BAD_GATEWAY", message });
		}

		const rowingItems = [...ergResults.value, ...waterResults.value];
		await db.activity_inbox.update({
			where: { id: batchId },
			data: { payload: rowingItems as Prisma.InputJsonValue },
		});

		const [batchResult] = await Promise.allSettled([
			processConcept2InboxBatchCommand({ batchId }, { db }),
		]);
		if (batchResult.status === "rejected") {
			const message =
				batchResult.reason instanceof Error
					? batchResult.reason.message
					: String(batchResult.reason);
			logger.error("batch failed", { batchId, error: message });
			await db.activity_inbox.update({
				where: { id: batchId },
				data: {
					status: "failed",
					completedAt: new Date(),
					errorMessage: message,
				},
			});
			throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logger.error("post-response processing threw", {
			batchId,
			error: message,
		});

		await db.activity_inbox.update({
			where: { id: batchId },
			data: {
				status: "failed",
				errorMessage: message,
			},
		});
	}
};
