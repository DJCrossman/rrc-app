import { createHmac, timingSafeEqual } from "node:crypto";
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

const SIGNATURE_TOLERANCE_SECONDS = 300;

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
	const signatureHeader = request.headers.get("x-strava-signature");

	const signingSecret =
		process.env.STRAVA_WEBHOOK_SIGNING_SECRET ??
		process.env.STRAVA_CLIENT_SECRET;
	const signatureCheck = verifyStravaSignature({
		rawBody,
		header: signatureHeader,
		secret: signingSecret,
	});
	if (signatureCheck === "invalid") {
		logger.warn("rejecting event — signature invalid");
		return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
	}
	if (signatureCheck === "missing_secret") {
		// Allow the event through but make the gap obvious — once a secret is
		// configured, any unsigned events will start being rejected.
		logger.warn(
			"accepting event without signature verification — no secret configured",
		);
	}

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

type SignatureCheck = "ok" | "invalid" | "missing_secret" | "missing_header";

function verifyStravaSignature({
	rawBody,
	header,
	secret,
}: {
	rawBody: string;
	header: string | null;
	secret: string | undefined;
}): SignatureCheck {
	if (!secret) return "missing_secret";
	if (!header) return "invalid";

	const parts: Record<string, string> = {};
	for (const segment of header.split(",")) {
		const idx = segment.indexOf("=");
		if (idx === -1) continue;
		parts[segment.slice(0, idx).trim()] = segment.slice(idx + 1).trim();
	}
	const t = parts.t;
	const v1 = parts.v1;
	if (!t || !v1) return "invalid";

	const ts = Number.parseInt(t, 10);
	if (!Number.isFinite(ts)) return "invalid";
	if (
		Math.abs(Math.floor(Date.now() / 1000) - ts) > SIGNATURE_TOLERANCE_SECONDS
	) {
		return "invalid";
	}

	const expected = createHmac("sha256", secret)
		.update(`${t}.${rawBody}`)
		.digest("hex");
	if (expected.length !== v1.length) return "invalid";

	const expectedBuf = Buffer.from(expected, "hex");
	const actualBuf = Buffer.from(v1, "hex");
	if (expectedBuf.length !== actualBuf.length) return "invalid";
	return timingSafeEqual(expectedBuf, actualBuf) ? "ok" : "invalid";
}
