import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@/schemas/user.schema";
import { getConcept2User } from "../../concept2/users/actions";
import { getAccessToken, isTokenExpired } from "../../concept2/utils";
import { getStravaAthlete } from "../../strava/athlete/actions";
import {
	getAccessToken as getStravaAccessToken,
	isTokenExpired as isStravaTokenExpired,
} from "../../strava/utils";
import { getUserById } from "../actions";

export async function GET(request: Request) {
	try {
		// TODO: Replace with actual authentication logic
		const userId = 1;
		const user = await getUserById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		const concept2Values = await getConcept2Values(request);
		const stravaValues = await getStravaValues(request);
		Object.assign(user, concept2Values, stravaValues);

		return NextResponse.json(user);
	} catch (error) {
		console.error("User info retrieval error:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve user info" },
			{ status: 500 },
		);
	}
}

const getConcept2Values = async (
	request: Request,
): Promise<Pick<User, "concept2Connected" | "concept2UserId">> => {
	try {
		const cookieStore = await cookies();
		const tokenExpired = await isTokenExpired({ cookieStore });
		if (tokenExpired) {
			const refreshResponse = await fetch(
				new URL("/api/v1/concept2/refresh", request.url),
				{
					method: "POST",
				},
			);

			if (!refreshResponse.ok) {
				return {
					concept2Connected: false,
					concept2UserId: undefined,
				};
			}
		}

		const accessToken = await getAccessToken({ cookieStore });
		if (!accessToken) {
			return {
				concept2Connected: false,
				concept2UserId: undefined,
			};
		}

		const concept2UserResponse = await getConcept2User({ accessToken });

		if (concept2UserResponse.status === "rejected") {
			return {
				concept2Connected: false,
				concept2UserId: undefined,
			};
		}

		return {
			concept2Connected: true,
			concept2UserId: concept2UserResponse.value.id,
		};
	} catch (error) {
		console.error("Concept2 values retrieval error:", error);
		return {
			concept2Connected: false,
			concept2UserId: undefined,
		};
	}
};

const getStravaValues = async (
	request: Request,
): Promise<Pick<User, "stravaConnected" | "stravaAthleteId">> => {
	try {
		const cookieStore = await cookies();
		const tokenExpired = await isStravaTokenExpired({ cookieStore });
		if (tokenExpired) {
			const refreshResponse = await fetch(
				new URL("/api/v1/strava/refresh", request.url),
				{
					method: "POST",
				},
			);

			if (!refreshResponse.ok) {
				return {
					stravaConnected: false,
					stravaAthleteId: undefined,
				};
			}
		}

		const accessToken = await getStravaAccessToken({ cookieStore });
		if (!accessToken) {
			return {
				stravaConnected: false,
				stravaAthleteId: undefined,
			};
		}

		const stravaAthleteResponse = await getStravaAthlete({ accessToken });

		if (stravaAthleteResponse.status === "rejected") {
			return {
				stravaConnected: false,
				stravaAthleteId: undefined,
			};
		}

		return {
			stravaConnected: true,
			stravaAthleteId: stravaAthleteResponse.value.id.toString(),
		};
	} catch (error) {
		console.error("Strava values retrieval error:", error);
		return {
			stravaConnected: false,
			stravaAthleteId: undefined,
		};
	}
};
