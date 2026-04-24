import { StravaError } from "@/app/api/v1/strava/types";
import {
	ensureValidToken,
	getAthlete,
	getStravaConfig,
	saveAthlete,
} from "@/app/api/v1/strava/utils";
import {
	type GetStravaAthleteInput,
	type StravaUser,
	stravaUserSchema,
} from "@/schemas";
import type { Context } from "@/server/context";

export async function getStravaAthleteQuery(
	input: GetStravaAthleteInput,
	{ cookieStore }: Context,
): Promise<PromiseSettledResult<StravaUser>> {
	try {
		const config = getStravaConfig();

		const cachedAthlete = await getAthlete({ cookieStore });
		if (cachedAthlete) {
			return {
				status: "fulfilled",
				value: cachedAthlete,
			};
		}

		let accessToken: string | null | undefined = input.accessToken;
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

		const athleteUrl = new URL(`${config.baseApiUrl}/athlete`);
		const athleteResponse = await fetch(athleteUrl.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (!athleteResponse.ok) {
			const errorText = await athleteResponse.text();
			console.error(
				"Failed to fetch athlete:",
				athleteResponse.status,
				errorText,
			);

			if (athleteResponse.status === 401) {
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
					message: "Failed to fetch athlete from Strava",
					status: athleteResponse.status,
				}),
			};
		}

		const athleteData = await athleteResponse.json();
		const parsedAthlete = await stravaUserSchema.safeParseAsync(athleteData);

		if (!parsedAthlete.success) {
			console.error("Failed to parse athlete:", parsedAthlete.error);
			return {
				status: "rejected",
				reason: new StravaError({
					message: "Failed to parse athlete data from Strava",
					status: 500,
				}),
			};
		}

		await saveAthlete({ athlete: parsedAthlete.data, cookieStore });

		return {
			status: "fulfilled",
			value: parsedAthlete.data,
		};
	} catch (error) {
		console.error("Error fetching Strava athlete:", error);
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
