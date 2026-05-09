import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import { concept2ActivitySchema } from "@/schemas";
import type { Context } from "@/server/context";
import { getConcept2AccessTokenForAthlete } from "../../common/get-concept2-access-token-for-athlete";
import { processConcept2InboxBatchCommand } from "../process-concept2-inbox-batch/process-concept2-inbox-batch.command";

const logger = createLogger("concept2.webhook");

// Concept2 Logbook webhooks emit events of these types. The result body is
// sometimes inlined (added/updated) and sometimes only referenced by id
// (deleted) — we accept both shapes and fall back to fetching when needed.
export const concept2WebhookEventSchema = z.object({
	type: z.enum(["result-added", "result-updated", "result-deleted"]),
	user_id: z.number().int(),
	result_id: z.number().int().optional(),
	result: concept2ActivitySchema.optional(),
});

export type Concept2WebhookEvent = z.infer<typeof concept2WebhookEventSchema>;

export async function processConcept2WebhookEventCommand(
	event: Concept2WebhookEvent,
	{ db, services }: Pick<Context, "db" | "services">,
) {
	const athlete = await db.athlete.findFirst({
		where: { concept2UserId: event.user_id },
		select: { id: true },
	});
	if (!athlete) {
		logger.info("ignoring event — no local athlete for user_id", {
			userId: event.user_id,
			type: event.type,
		});
		return { handled: false, reason: "athlete_not_found" as const };
	}

	const resultId = event.result?.id ?? event.result_id;
	if (!resultId) {
		logger.warn("ignoring event — no result id", {
			athleteId: athlete.id,
			type: event.type,
		});
		return { handled: false, reason: "missing_result_id" as const };
	}

	if (event.type === "result-deleted") {
		const result = await db.activity.deleteMany({
			where: {
				athleteId: athlete.id,
				conceptTwoId: BigInt(resultId),
			},
		});
		logger.info("activity deleted", {
			athleteId: athlete.id,
			conceptTwoId: resultId,
			deleted: result.count,
		});
		return { handled: true, kind: "deleted" as const, deleted: result.count };
	}

	// result-added | result-updated — prefer the inline result; otherwise fetch
	// the latest data from Concept2 so the persisted row reflects current state.
	let activity = event.result ?? null;
	if (!activity) {
		const accessToken = await getConcept2AccessTokenForAthlete({
			db,
			services,
			athleteId: athlete.id,
		});
		if (!accessToken) {
			logger.warn("no access token — cannot fetch result", {
				athleteId: athlete.id,
				resultId,
			});
			return { handled: false, reason: "no_access_token" as const };
		}
		activity = await services.concept2.fetchResult(accessToken, resultId);
	}

	if (!activity) {
		// Fetch returned 404 — Concept2 considers the result gone, so mirror by
		// removing our local copy if any.
		const result = await db.activity.deleteMany({
			where: {
				athleteId: athlete.id,
				conceptTwoId: BigInt(resultId),
			},
		});
		logger.info("result unavailable — removed local copy", {
			athleteId: athlete.id,
			conceptTwoId: resultId,
			deleted: result.count,
		});
		return { handled: true, kind: "removed_unavailable" as const };
	}

	const batch = await db.activity_inbox.create({
		data: {
			athleteId: athlete.id,
			source: "concept2",
			kind: "webhook",
			payload: [activity] as unknown as Prisma.InputJsonValue,
		},
	});
	const processed = await processConcept2InboxBatchCommand(
		{ batchId: batch.id },
		{ db },
	);
	logger.info("activity persisted", {
		athleteId: athlete.id,
		conceptTwoId: resultId,
		type: event.type,
		batchId: batch.id,
		activitiesCreated: processed.activitiesCreated,
	});
	return { handled: true, kind: "persisted" as const, batchId: batch.id };
}
