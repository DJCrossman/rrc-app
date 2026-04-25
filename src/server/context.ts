import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createConcept2Service } from "./services/concept2-service";
import { createStravaService } from "./services/strava-service";

type BaseContext = {
	db: typeof db;
	services: {
		strava: ReturnType<typeof createStravaService>;
		concept2: ReturnType<typeof createConcept2Service>;
	};
};

export type UnauthenticatedContext = BaseContext & { userId: null };
export type AuthenticatedContext = BaseContext & { userId: string };
export type Context = UnauthenticatedContext | AuthenticatedContext;

export async function createTRPCContext(_opts?: {
	req?: Request;
}): Promise<Context> {
	const { userId } = await auth();
	const cookieStore = await cookies();
	const services = {
		strava: createStravaService({ cookieStore }),
		concept2: createConcept2Service({ cookieStore }),
	};
	return {
		userId: userId ?? null,
		db,
		services,
	};
}
