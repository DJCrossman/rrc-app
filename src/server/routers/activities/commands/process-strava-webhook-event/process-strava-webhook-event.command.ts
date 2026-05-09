import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import type { Context } from "@/server/context";
import { getStravaAccessTokenForAthlete } from "../../common/get-strava-access-token-for-athlete";
import { processStravaInboxBatchCommand } from "../process-strava-inbox-batch/process-strava-inbox-batch.command";

const logger = createLogger("strava.webhook");

const ROWING_SPORT_TYPES = new Set(["Rowing", "VirtualRow"]);

export const stravaWebhookEventSchema = z.object({
	object_type: z.enum(["activity", "athlete"]),
	object_id: z.number().int(),
	aspect_type: z.enum(["create", "update", "delete"]),
	owner_id: z.number().int(),
	subscription_id: z.number().int(),
	event_time: z.number().int(),
	updates: z.record(z.string(), z.union([z.string(), z.boolean()])).default({}),
});

export type StravaWebhookEvent = z.infer<typeof stravaWebhookEventSchema>;

export async function processStravaWebhookEventCommand(
	event: StravaWebhookEvent,
	{ db, services }: Pick<Context, "db" | "services">,
) {
	const athlete = await db.athlete.findFirst({
		where: { stravaAthleteId: event.owner_id.toString() },
		select: { id: true },
	});
	if (!athlete) {
		logger.info("ignoring event — no local athlete for owner", {
			ownerId: event.owner_id,
			objectType: event.object_type,
			aspectType: event.aspect_type,
		});
		return { handled: false, reason: "athlete_not_found" as const };
	}

	if (event.object_type === "athlete") {
		// Strava sends athlete updates when an athlete deauthorizes the app.
		// Per docs, updates always carries `authorized: "false"` for these.
		const authorized = event.updates.authorized;
		if (
			event.aspect_type === "update" &&
			(authorized === "false" || authorized === false)
		) {
			await db.athlete.update({
				where: { id: athlete.id },
				data: {
					stravaAthleteId: null,
					stravaAccessToken: null,
					stravaRefreshToken: null,
					stravaTokenExpiresAt: null,
					stravaAthleteJson: Prisma.JsonNull,
					stravaConnectedAt: null,
				},
			});
			logger.info("athlete deauthorized — cleared strava columns", {
				athleteId: athlete.id,
			});
			return { handled: true, kind: "deauthorized" as const };
		}
		logger.info("ignoring athlete event", {
			athleteId: athlete.id,
			aspectType: event.aspect_type,
			updates: event.updates,
		});
		return { handled: false, reason: "unsupported_athlete_event" as const };
	}

	// object_type === "activity"
	if (event.aspect_type === "delete") {
		const result = await db.activity.deleteMany({
			where: {
				athleteId: athlete.id,
				stravaId: BigInt(event.object_id),
			},
		});
		logger.info("activity deleted", {
			athleteId: athlete.id,
			stravaId: event.object_id,
			deleted: result.count,
		});
		return { handled: true, kind: "deleted" as const, deleted: result.count };
	}

	// create | update — fetch the activity from Strava and route through the
	// existing inbox batch processor so persistence stays consistent with the
	// scheduled sync path.
	const accessToken = await getStravaAccessTokenForAthlete({
		db,
		services,
		athleteId: athlete.id,
	});
	if (!accessToken) {
		logger.warn("no access token — cannot fetch activity", {
			athleteId: athlete.id,
			stravaId: event.object_id,
		});
		return { handled: false, reason: "no_access_token" as const };
	}

	const activity = await services.strava.fetchActivity(
		accessToken,
		event.object_id,
	);
	if (!activity) {
		// 404 on Strava — most commonly the activity was made Only You for an
		// app without activity:read_all (treated as a delete by Strava) or was
		// deleted between the event firing and our fetch. Mirror Strava's
		// semantics and remove our local copy.
		const result = await db.activity.deleteMany({
			where: {
				athleteId: athlete.id,
				stravaId: BigInt(event.object_id),
			},
		});
		logger.info("activity unavailable — removed local copy", {
			athleteId: athlete.id,
			stravaId: event.object_id,
			deleted: result.count,
		});
		return { handled: true, kind: "removed_unavailable" as const };
	}

	if (!ROWING_SPORT_TYPES.has(activity.sport_type)) {
		// If the athlete reclassified an existing rowing activity, drop our
		// stale local copy so the DB stays consistent with Strava.
		const result = await db.activity.deleteMany({
			where: {
				athleteId: athlete.id,
				stravaId: BigInt(event.object_id),
			},
		});
		logger.info("non-rowing activity — skipped persistence", {
			athleteId: athlete.id,
			stravaId: activity.id,
			sportType: activity.sport_type,
			deletedStaleLocal: result.count,
		});
		return { handled: true, kind: "skipped_non_rowing" as const };
	}

	const batch = await db.activity_inbox.create({
		data: {
			athleteId: athlete.id,
			source: "strava",
			kind: "webhook",
			payload: [activity] as unknown as Prisma.InputJsonValue,
		},
	});
	const processed = await processStravaInboxBatchCommand(
		{ batchId: batch.id },
		{ db },
	);
	logger.info("activity persisted", {
		athleteId: athlete.id,
		stravaId: activity.id,
		aspectType: event.aspect_type,
		batchId: batch.id,
		activitiesCreated: processed.activitiesCreated,
	});
	return { handled: true, kind: "persisted" as const, batchId: batch.id };
}
