import { after, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import {
	processStravaWebhookEventCommand,
	type StravaWebhookEvent,
	stravaWebhookEventSchema,
} from "@/server/routers/activities/commands/process-strava-webhook-event/process-strava-webhook-event.command";
import { createConcept2Service } from "@/server/services/concept2-service";
import { createRcaService } from "@/server/services/rca-service";
import { createStravaService } from "@/server/services/strava-service";

const logger = createLogger("strava.webhook.route");

// Validation handshake — Strava issues a GET to the callback URL when a
// subscription is created. We must echo `hub.challenge` after confirming
// `hub.verify_token` matches our configured secret.
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const mode = searchParams.get("hub.mode");
	const verifyToken = searchParams.get("hub.verify_token");
	const challenge = searchParams.get("hub.challenge");

	const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
	if (!expectedToken) {
		logger.error("STRAVA_WEBHOOK_VERIFY_TOKEN is not configured");
		return NextResponse.json({ error: "not_configured" }, { status: 500 });
	}

	if (mode !== "subscribe" || !challenge) {
		logger.warn("invalid challenge request", {
			mode,
			hasChallenge: !!challenge,
		});
		return NextResponse.json({ error: "bad_request" }, { status: 400 });
	}

	if (verifyToken !== expectedToken) {
		logger.warn("verify token mismatch");
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}

	logger.info("subscription challenge accepted");
	return NextResponse.json({ "hub.challenge": challenge });
}

export async function POST(request: Request) {
	const rawBody = await request.text();

	let parsedJson: unknown;
	try {
		parsedJson = JSON.parse(rawBody);
	} catch {
		logger.warn("rejecting event — body is not valid JSON");
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}

	const parsed = stravaWebhookEventSchema.safeParse(parsedJson);
	if (!parsed.success) {
		logger.warn("rejecting event — schema mismatch", {
			issues: parsed.error.issues.slice(0, 5),
		});
		return NextResponse.json({ error: "bad_event" }, { status: 400 });
	}

	const event: StravaWebhookEvent = parsed.data;
	logger.info("event received", {
		objectType: event.object_type,
		aspectType: event.aspect_type,
		objectId: event.object_id,
		ownerId: event.owner_id,
		subscriptionId: event.subscription_id,
	});

	// Strava does not sign webhook events, so the only server-side guard is
	// matching the subscription id we registered. Accept-and-warn when it is
	// unset so events keep flowing until the id is configured.
	const expectedSubscriptionId = process.env.STRAVA_WEBHOOK_SUBSCRIPTION_ID;
	if (!expectedSubscriptionId) {
		logger.warn(
			"accepting event without subscription check — STRAVA_WEBHOOK_SUBSCRIPTION_ID not configured",
		);
	} else if (String(event.subscription_id) !== expectedSubscriptionId) {
		logger.warn("rejecting event — subscription id mismatch", {
			expected: expectedSubscriptionId,
			received: event.subscription_id,
		});
		return NextResponse.json(
			{ error: "unknown_subscription" },
			{ status: 403 },
		);
	}

	// Strava requires a 200 within 2 seconds. Defer all DB / upstream work to
	// after the response is flushed.
	after(async () => {
		try {
			const services = {
				strava: createStravaService(),
				concept2: createConcept2Service(),
				rca: createRcaService(),
			};
			await processStravaWebhookEventCommand(event, { db, services });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			logger.error("event processing failed", {
				objectType: event.object_type,
				aspectType: event.aspect_type,
				objectId: event.object_id,
				ownerId: event.owner_id,
				error: message,
			});
		}
	});

	return NextResponse.json({ ok: true });
}
