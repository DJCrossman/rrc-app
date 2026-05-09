import { StravaError } from "@/app/api/v1/strava/types";
import { createLogger } from "@/lib/logger";
import {
	type GetStravaAthleteInput,
	type StravaUser,
	stravaUserSchema,
} from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { StravaServiceError } from "@/server/services/strava-service";
import { getStravaAccessToken } from "../../common/get-strava-access-token";

const logger = createLogger("strava.get-athlete");

export async function getStravaAthleteQuery(
	_input: GetStravaAthleteInput,
	ctx: AuthenticatedContext,
): Promise<PromiseSettledResult<StravaUser>> {
	const { db, services, userId } = ctx;
	try {
		const row = await db.athlete.findUnique({
			where: { userId },
			select: { id: true, stravaAthleteJson: true },
		});

		if (row?.stravaAthleteJson) {
			const cached = stravaUserSchema.safeParse(row.stravaAthleteJson);
			if (cached.success) {
				return { status: "fulfilled", value: cached.data };
			}
			logger.warn("cached stravaAthleteJson failed schema parse — refetching", {
				issues: cached.error.issues.slice(0, 5),
			});
		}

		const accessToken = await getStravaAccessToken(ctx);
		if (!accessToken) {
			return {
				status: "rejected",
				reason: new StravaError({
					message: "Authentication required",
					auth_url: "/api/v1/strava/authorize",
					status: 401,
				}),
			};
		}

		const value = await services.strava.fetchAthlete(accessToken);

		if (row) {
			await db.athlete.update({
				where: { id: row.id },
				data: { stravaAthleteJson: value },
			});
		}

		return { status: "fulfilled", value };
	} catch (error) {
		if (error instanceof StravaServiceError) {
			return {
				status: "rejected",
				reason: new StravaError({
					message: error.authRequired
						? "Authentication required"
						: error.message,
					auth_url: error.authRequired ? "/api/v1/strava/authorize" : undefined,
					status: error.status,
				}),
			};
		}
		return {
			status: "rejected",
			reason: new StravaError({
				message:
					error instanceof Error
						? error.message
						: "Failed to fetch athlete from Strava",
				status: 500,
			}),
		};
	}
}
