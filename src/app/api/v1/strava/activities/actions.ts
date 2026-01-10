import { DateTime } from "luxon";
import { cookies } from "next/headers";
import { z } from "zod";
import { type StravaActivity, stravaActivitySchema } from "@/schemas";
import { StravaError } from "../types";
import { ensureValidToken, getStravaConfig } from "../utils";

const commandSchema = z.object({
	accessToken: z.string().optional(),
});
type StravaActivitiesParams = z.infer<typeof commandSchema>;

export const getStravaActivities = async (
	params: StravaActivitiesParams = {},
): Promise<PromiseSettledResult<StravaActivity[]>> => {
	try {
		const config = getStravaConfig();
		const cookieStore = await cookies();

		let accessToken: string | null | undefined = params.accessToken;
		if (!accessToken) {
			const refreshUrl = `${config.baseApiUrl.replace("/api/v3", "")}/api/v1/strava/refresh`;
			accessToken = await ensureValidToken({ cookieStore, refreshUrl });

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
		}

		const afterDate = DateTime.now().minus({ months: 4 }).startOf("month");
		const afterTimestamp = Math.floor(afterDate.toSeconds());

		// TODO: Add rate limit handling (100 req/15min, 1000 req/day)
		const allActivities: StravaActivity[] = [];
		let page = 1;
		const perPage = 200; // Max allowed by Strava

		while (true) {
			const activitiesUrl = new URL(`${config.baseApiUrl}/athlete/activities`);
			activitiesUrl.searchParams.set("after", afterTimestamp.toString());
			activitiesUrl.searchParams.set("page", page.toString());
			activitiesUrl.searchParams.set("per_page", perPage.toString());

			const activitiesResponse = await fetch(activitiesUrl.toString(), {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/json",
				},
			});

			if (!activitiesResponse.ok) {
				const errorText = await activitiesResponse.text();
				console.error(
					"Failed to fetch activities:",
					activitiesResponse.status,
					errorText,
				);

				if (activitiesResponse.status === 401) {
					return {
						status: "rejected",
						reason: new StravaError({
							message: "Authentication required",
							auth_url: "/api/v1/strava/authorize",
							status: 401,
						}),
					};
				}

				return {
					status: "rejected",
					reason: new StravaError({
						message: "Failed to fetch activities from Strava",
						status: activitiesResponse.status,
					}),
				};
			}

			const pageActivities = await activitiesResponse.json();

			if (!Array.isArray(pageActivities) || pageActivities.length === 0) {
				break;
			}

			const rowingActivities = pageActivities.filter(
				(activity) => activity.sport_type === "Rowing",
			);

			for (const activity of rowingActivities) {
				const parsedActivity =
					await stravaActivitySchema.safeParseAsync(activity);

				if (parsedActivity.success) {
					allActivities.push(parsedActivity.data);
				} else {
					console.error("Failed to parse activity:", parsedActivity.error);
				}
			}

			page++;
		}

		return {
			status: "fulfilled",
			value: allActivities,
		};
	} catch (error) {
		console.error("Error fetching Strava activities:", error);
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
};
