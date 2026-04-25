import { StravaError } from "@/app/api/v1/strava/types";
import type { GetStravaActivitiesInput, StravaActivity } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { StravaServiceError } from "@/server/services/strava-service";

export async function getStravaActivitiesQuery(
	_input: GetStravaActivitiesInput,
	{ services }: AuthenticatedContext,
): Promise<PromiseSettledResult<StravaActivity[]>> {
	try {
		const value = await services.strava.fetchRecentRowingActivities();
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
