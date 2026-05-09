import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { envVars } from "@/lib/env";
import type { CurrentAthlete } from "@/lib/trpc/types";
import { createServerCaller } from "@/server/caller";
import { getAccessToken, isTokenExpired } from "../../concept2/utils";
import { getSession as getRcaSession } from "../../rca/utils";

export async function GET(request: Request) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await ensureDefaultOrganizationMembership(userId);

		const trpc = await createServerCaller();
		const user = await trpc.users.findOrCreateUserAndAthleteByUserId();

		const concept2Values = await getConcept2Values(request, trpc);
		const rcaValues = await getRcaValues();

		return NextResponse.json({
			...user,
			...concept2Values,
			...rcaValues,
		});
	} catch (error) {
		console.error("User info retrieval error:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve user info" },
			{ status: 500 },
		);
	}
}

const ensureDefaultOrganizationMembership = async (userId: string) => {
	const organizationId = envVars.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;
	const client = await clerkClient();
	const memberships = await client.users.getOrganizationMembershipList({
		userId,
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
		userId,
		role: "org:member",
	});
};

const getConcept2Values = async (
	request: Request,
	trpc: Awaited<ReturnType<typeof createServerCaller>>,
): Promise<Pick<CurrentAthlete, "concept2Connected" | "concept2UserId">> => {
	try {
		const cookieStore = await cookies();
		const tokenExpired = await isTokenExpired({ cookieStore });
		if (tokenExpired) {
			const refreshResponse = await fetch(
				new URL("/api/v1/concept2/refresh", request.url),
				{ method: "POST" },
			);

			if (!refreshResponse.ok) {
				return { concept2Connected: false, concept2UserId: null };
			}
		}

		const accessToken = await getAccessToken({ cookieStore });
		if (!accessToken) {
			return { concept2Connected: false, concept2UserId: null };
		}

		const concept2UserResponse = await trpc.activities.getConcept2User({
			accessToken,
		});

		if (concept2UserResponse.status === "rejected") {
			return { concept2Connected: false, concept2UserId: null };
		}

		return {
			concept2Connected: true,
			concept2UserId: concept2UserResponse.value.id,
		};
	} catch (error) {
		console.error("Concept2 values retrieval error:", error);
		return { concept2Connected: false, concept2UserId: null };
	}
};

const getRcaValues = async (): Promise<
	Pick<CurrentAthlete, "rcaConnected">
> => {
	try {
		const cookieStore = await cookies();
		const session = await getRcaSession({ cookieStore });
		return { rcaConnected: session !== null };
	} catch (error) {
		console.error("RCA values retrieval error:", error);
		return { rcaConnected: false };
	}
};
