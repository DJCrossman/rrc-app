import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";
import { decryptToken } from "@/server/integration-token-crypto";
import type { RcaSessionData } from "@/server/services/rca-service";

const logger = createLogger("rca.session");

type RcaCtx = Pick<AuthenticatedContext, "db" | "athlete" | "services">;

const sessionCache = new WeakMap<RcaCtx, Promise<RcaSessionData | null>>();

export async function getRcaSession(
	ctx: RcaCtx,
	{ forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<RcaSessionData | null> {
	if (!forceRefresh) {
		const cached = sessionCache.get(ctx);
		if (cached) return cached;
	}
	const promise = loadSession(ctx);
	sessionCache.set(ctx, promise);
	return promise;
}

async function loadSession(ctx: RcaCtx): Promise<RcaSessionData | null> {
	const { athlete, services } = ctx;
	if (!athlete.rcaUsername || !athlete.rcaPassword) {
		logger.info("no RCA credentials stored");
		return null;
	}
	const credentials = {
		username: decryptToken(athlete.rcaUsername),
		password: decryptToken(athlete.rcaPassword),
	};
	const result = await services.rca.login(credentials);
	if (!result.ok) {
		logger.warn("RCA re-login failed", { reason: result.reason });
		return null;
	}
	logger.info("RCA session established");
	return result.session;
}

export async function clearRcaCredentials({
	db,
	athlete,
}: Pick<AuthenticatedContext, "db" | "athlete">): Promise<void> {
	await db.athlete.update({
		where: { id: athlete.id },
		data: {
			rcaUsername: null,
			rcaPassword: null,
			rcaConnectedAt: null,
		},
	});
}
