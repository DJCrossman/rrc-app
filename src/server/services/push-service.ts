import { sendNotification } from "web-push";
import type { PrismaClient } from "@/generated/prisma/client";
import { envVars } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import {
	buildPushPayload,
	filterNotificationRecipients,
	NOTIFICATION_SCOPE_ALL,
	type PushMessage,
} from "@/lib/notifications";

const logger = createLogger("push.service");

const PUSH_TTL_SECONDS = 24 * 60 * 60;
const GONE_STATUS_CODES = new Set([404, 410]);

export type PushResult = {
	/** Distinct athletes with at least one device the push reached. */
	reached: number;
	sent: number;
	failed: number;
	removed: number;
	skipped: number;
};

export type PushService = {
	isConfigured: boolean;
	publicKey: string | null;
	sendPush: (athleteIds: string[], message: PushMessage) => Promise<PushResult>;
};

type PushDb = Pick<
	PrismaClient,
	"push_subscription" | "notification_preference"
>;

export function createPushService({ db }: { db: PushDb }): PushService {
	const publicKey = envVars.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || null;
	const privateKey = envVars.WEB_PUSH_PRIVATE_KEY || null;
	const vapidDetails =
		publicKey && privateKey
			? { subject: envVars.WEB_PUSH_SUBJECT, publicKey, privateKey }
			: null;

	return {
		isConfigured: vapidDetails !== null,
		publicKey,
		sendPush: async (athleteIds, message) => {
			const result: PushResult = {
				reached: 0,
				sent: 0,
				failed: 0,
				removed: 0,
				skipped: 0,
			};
			const uniqueIds = [...new Set(athleteIds)];
			if (uniqueIds.length === 0) return result;
			if (!vapidDetails) {
				logger.warn("push not configured, skipping", {
					athletes: uniqueIds.length,
				});
				return { ...result, skipped: uniqueIds.length };
			}

			try {
				const preferenceRows = await db.notification_preference.findMany({
					where: {
						athleteId: { in: uniqueIds },
						scope: {
							in: [
								NOTIFICATION_SCOPE_ALL,
								message.scope ?? NOTIFICATION_SCOPE_ALL,
							],
						},
					},
					select: { athleteId: true, scope: true, enabled: true },
				});
				const recipients = filterNotificationRecipients(
					uniqueIds,
					preferenceRows,
					message.scope,
				);
				result.skipped = uniqueIds.length - recipients.length;
				if (recipients.length === 0) return result;

				const subscriptions = await db.push_subscription.findMany({
					where: { athleteId: { in: recipients } },
					select: {
						id: true,
						athleteId: true,
						endpoint: true,
						p256dh: true,
						auth: true,
					},
				});
				const payload = buildPushPayload(message);
				const outcomes = await Promise.all(
					subscriptions.map(async (subscription) => ({
						id: subscription.id,
						outcome: await deliver(subscription, payload, vapidDetails),
					})),
				);

				const idsWith = (outcome: DeliveryOutcome) =>
					outcomes.filter((o) => o.outcome === outcome).map((o) => o.id);
				const sentIds = idsWith("sent");
				const goneIds = idsWith("gone");
				const failedIds = idsWith("failed");
				const now = new Date();

				await Promise.all([
					sentIds.length > 0 &&
						db.push_subscription.updateMany({
							where: { id: { in: sentIds } },
							data: { lastUsedAt: now, failedAt: null },
						}),
					goneIds.length > 0 &&
						db.push_subscription.deleteMany({ where: { id: { in: goneIds } } }),
					failedIds.length > 0 &&
						db.push_subscription.updateMany({
							where: { id: { in: failedIds } },
							data: { failedAt: now },
						}),
				]);

				result.reached = new Set(
					subscriptions
						.filter(({ id }) => sentIds.includes(id))
						.map(({ athleteId }) => athleteId),
				).size;
				result.sent = sentIds.length;
				result.removed = goneIds.length;
				result.failed = failedIds.length;
				logger.info("push sent", { ...result, tag: message.tag });
			} catch (error) {
				logger.error("sendPush failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
			return result;
		},
	};
}

type DeliveryOutcome = "sent" | "gone" | "failed";

async function deliver(
	subscription: { id: string; endpoint: string; p256dh: string; auth: string },
	payload: string,
	vapidDetails: { subject: string; publicKey: string; privateKey: string },
): Promise<DeliveryOutcome> {
	try {
		await sendNotification(
			{
				endpoint: subscription.endpoint,
				keys: { p256dh: subscription.p256dh, auth: subscription.auth },
			},
			payload,
			{ vapidDetails, TTL: PUSH_TTL_SECONDS, urgency: "high" },
		);
		return "sent";
	} catch (error) {
		const statusCode = getStatusCode(error);
		if (statusCode !== null && GONE_STATUS_CODES.has(statusCode)) return "gone";
		logger.warn("push delivery failed", {
			subscriptionId: subscription.id,
			statusCode,
			error: error instanceof Error ? error.message : String(error),
		});
		return "failed";
	}
}

function getStatusCode(error: unknown): number | null {
	if (typeof error !== "object" || error === null) return null;
	const { statusCode } = error as { statusCode?: unknown };
	return typeof statusCode === "number" ? statusCode : null;
}
