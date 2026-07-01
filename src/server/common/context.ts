import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isDefaultOrgAdmin } from "@/server/clerk/default-organization";
import type { AthleteRow } from "@/server/routers/athletes/common/map-to-athlete-dto";
import { createConcept2Service } from "../services/concept2-service";
import { createRcaService } from "../services/rca-service";
import { createStravaService } from "../services/strava-service";

type BaseContext = {
	db: typeof db;
	services: {
		strava: ReturnType<typeof createStravaService>;
		concept2: ReturnType<typeof createConcept2Service>;
		rca: ReturnType<typeof createRcaService>;
	};
};

export type SessionUser = {
	id: string;
	isAdmin: boolean;
};

export type ContextAthlete = AthleteRow;

export type RequestContext = BaseContext & {
	user: SessionUser | null;
};

export type UnauthenticatedContext = BaseContext & {
	user: SessionUser | null;
};

export type AuthenticatedContext = BaseContext & {
	user: SessionUser;
	athlete: ContextAthlete;
};

export type AdminContext = BaseContext & {
	user: SessionUser & { isAdmin: true };
	athlete: ContextAthlete | null;
};

export type OnboardingContext = BaseContext & {
	user: SessionUser;
	athlete: null;
};

export async function createTRPCContext(_opts?: {
	req?: Request;
}): Promise<RequestContext> {
	const session = await auth();
	const services = {
		strava: createStravaService(),
		concept2: createConcept2Service(),
		rca: createRcaService(),
	};

	if (!session.userId) {
		return { user: null, db, services };
	}

	const isAdmin = await isDefaultOrgAdmin(session.userId);

	return {
		user: { id: session.userId, isAdmin },
		db,
		services,
	};
}
