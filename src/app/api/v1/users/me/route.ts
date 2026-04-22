import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CurrentAthlete } from "@/app/api/v1/users/utils";
import { envVars } from "@/lib/env";
import { getConcept2User } from "../../concept2/users/actions";
import { getAccessToken, isTokenExpired } from "../../concept2/utils";
import { getStravaAthlete } from "../../strava/athlete/actions";
import {
	getAccessToken as getStravaAccessToken,
	isTokenExpired as isStravaTokenExpired,
} from "../../strava/utils";
import { findOrCreateUserAndAthleteByClerkId } from "../actions";

export async function GET(request: Request) {
	try {
		const { userId: clerkUserId } = await auth();

		if (!clerkUserId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await ensureDefaultOrganizationMembership(clerkUserId);

		const user = await findOrCreateUserAndAthleteByClerkId(clerkUserId);

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

const ensureDefaultOrganizationMembership = async (clerkUserId: string) => {
	const organizationId = envVars.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;
	const client = await clerkClient();
	const memberships = await client.users.getOrganizationMembershipList({
		userId: clerkUserId,
		limit: 100,
	});

	const isMember = memberships.data.some(
		(membership) => membership.organization.id === organizationId,
	);

	if (isMember) {
		return;
	}

	await client.organizations.createOrganizationMembership({
		organizationId,
		userId: clerkUserId,
		role: "org:member",
	});
};

const getConcept2Values = async (
	request: Request,
): Promise<Pick<CurrentAthlete, "concept2Connected" | "concept2UserId">> => {
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
					concept2UserId: null,
				};
			}
		}

		const accessToken = await getAccessToken({ cookieStore });
		if (!accessToken) {
			return {
				concept2Connected: false,
				concept2UserId: null,
			};
		}

		const concept2UserResponse = await getConcept2User({ accessToken });

		if (concept2UserResponse.status === "rejected") {
			return {
				concept2Connected: false,
				concept2UserId: null,
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
			concept2UserId: null,
		};
	}
};

const getStravaValues = async (
	request: Request,
): Promise<Pick<CurrentAthlete, "stravaConnected" | "stravaAthleteId">> => {
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
					stravaAthleteId: null,
				};
			}
		}

		const accessToken = await getStravaAccessToken({ cookieStore });
		if (!accessToken) {
			return {
				stravaConnected: false,
				stravaAthleteId: null,
			};
		}

		const stravaAthleteResponse = await getStravaAthlete({ accessToken });

		if (stravaAthleteResponse.status === "rejected") {
			return {
				stravaConnected: false,
				stravaAthleteId: null,
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
			stravaAthleteId: null,
		};
	}
};
