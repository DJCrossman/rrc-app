import { StravaError } from "@/app/api/v1/strava/types";
import type { GetStravaActivitiesInput, StravaActivity } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { StravaServiceError } from "@/server/services/strava-service";
import { getStravaAccessToken } from "../../common/get-strava-access-token";

export async function getStravaActivitiesQuery(
	_input: GetStravaActivitiesInput,
	ctx: AuthenticatedContext,
): Promise<PromiseSettledResult<StravaActivity[]>> {
	const { services } = ctx;
	try {
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
		const value =
			await services.strava.fetchRecentRowingActivities(accessToken);
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
						: "Failed to fetch activities from Strava",
				status: 500,
			}),
		};
	}
}
