import { after, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import {
	type Concept2WebhookEvent,
	concept2WebhookEventSchema,
	processConcept2WebhookEventCommand,
} from "@/server/routers/activities/commands/process-concept2-webhook-event/process-concept2-webhook-event.command";
import { createConcept2Service } from "@/server/services/concept2-service";
import { createRcaService } from "@/server/services/rca-service";
import { createStravaService } from "@/server/services/strava-service";

const logger = createLogger("concept2.webhook.route");

export async function GET() {
	return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
	let parsedJson: unknown;
	try {
		parsedJson = await request.json();
	} catch {
		logger.warn("rejecting event — body is not valid JSON");
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}

	const parsed = concept2WebhookEventSchema.safeParse(parsedJson);
	if (!parsed.success) {
		logger.warn("rejecting event — schema mismatch", {
			issues: parsed.error.issues.slice(0, 5),
		});
		return NextResponse.json({ error: "bad_event" }, { status: 400 });
	}

	const event: Concept2WebhookEvent = parsed.data;
	logger.info("event received", {
		type: event.type,
		userId: event.user_id,
		resultId: event.result?.id ?? event.result_id ?? null,
	});

	// Concept2 expects a quick 200 ack — defer DB / upstream work until after
	// the response is flushed. Authenticity comes from the user_id mapping to a
	// known athlete with Concept2 connected; events for unknown users are
	// logged and skipped inside the command.
	after(async () => {
		try {
			const services = {
				strava: createStravaService(),
				concept2: createConcept2Service(),
				rca: createRcaService(),
			};
			await processConcept2WebhookEventCommand(event, { db, services });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			logger.error("event processing failed", {
				type: event.type,
				userId: event.user_id,
				resultId: event.result?.id ?? event.result_id ?? null,
				error: message,
			});
		}
	});

	return NextResponse.json({ ok: true });
}
