import type { Prisma } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import { type Concept2WebhookEvent, getConcept2WebhookUserId } from "@/schemas";
import type { Context } from "@/server/context";
import { getConcept2AccessTokenForAthlete } from "../../common/get-concept2-access-token-for-athlete";
import { removeActivitySource } from "../../common/remove-activity-source";
import { processConcept2InboxBatchCommand } from "../process-concept2-inbox-batch/process-concept2-inbox-batch.command";

const logger = createLogger("concept2.webhook");

export async function processConcept2WebhookEventCommand(
	event: Concept2WebhookEvent,
	{ db, services }: Pick<Context, "db" | "services">,
) {
	// Without a user_id every event would match an arbitrary athlete, since
	// Prisma drops `undefined` filters instead of matching nothing.
	const userId = getConcept2WebhookUserId(event);
	if (userId === undefined) {
		logger.warn("ignoring event — no user_id on event or result", {
			type: event.type,
			resultId: event.result?.id ?? event.result_id ?? null,
		});
		return { handled: false, reason: "missing_user_id" as const };
	}

	const athlete = await db.athlete.findFirst({
		where: { concept2UserId: userId },
		select: { id: true },
	});
	if (!athlete) {
		logger.info("ignoring event — no local athlete for user_id", {
			userId,
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
		const result = await removeActivitySource({
			db,
			athleteId: athlete.id,
			source: "concept2",
			externalId: resultId,
		});
		logger.info("activity deleted", {
			athleteId: athlete.id,
			conceptTwoId: resultId,
			...result,
		});
		return { handled: true, kind: "deleted" as const, ...result };
	}

	// result-added | result-updated — the inlined result is trimmed (no stroke,
	// heart-rate or interval data), so fetch the full record and keep the inline
	// copy only as a fallback for when we cannot reach Concept2.
	const accessToken = await getConcept2AccessTokenForAthlete({
		db,
		services,
		athleteId: athlete.id,
	});
	if (!accessToken && !event.result) {
		logger.warn("no access token — cannot fetch result", {
			athleteId: athlete.id,
			resultId,
		});
		return { handled: false, reason: "no_access_token" as const };
	}

	let activity = accessToken
		? await services.concept2.fetchResult(accessToken, resultId)
		: null;
	const fetched = activity !== null;

	if (!activity && event.result) {
		// No token, or the result is not readable yet — the inlined body is
		// thinner than the API's, but better than dropping the event.
		logger.warn("falling back to the trimmed webhook result", {
			athleteId: athlete.id,
			resultId,
			hadAccessToken: !!accessToken,
		});
		activity = event.result;
	}

	if (!activity) {
		// Fetch returned 404 and the event carried no body — Concept2 considers
		// the result gone, so mirror by removing our local copy if any.
		const result = await removeActivitySource({
			db,
			athleteId: athlete.id,
			source: "concept2",
			externalId: resultId,
		});
		logger.info("result unavailable — removed local copy", {
			athleteId: athlete.id,
			conceptTwoId: resultId,
			...result,
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
		fetched,
		activitiesCreated: processed.activitiesCreated,
	});
	return { handled: true, kind: "persisted" as const, batchId: batch.id };
}
