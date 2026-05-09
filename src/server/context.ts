import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createConcept2Service } from "./services/concept2-service";
import { createRcaService } from "./services/rca-service";
import { createStravaService } from "./services/strava-service";

type BaseContext = {
	db: typeof db;
	services: {
		strava: ReturnType<typeof createStravaService>;
		concept2: ReturnType<typeof createConcept2Service>;
		rca: ReturnType<typeof createRcaService>;
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
		strava: createStravaService(),
		concept2: createConcept2Service({ cookieStore }),
		rca: createRcaService({ cookieStore }),
	};
	return {
		userId: userId ?? null,
		db,
		services,
	};
}
