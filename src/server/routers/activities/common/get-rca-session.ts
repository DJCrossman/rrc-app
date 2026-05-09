import { createLogger } from "@/lib/logger";
import type { AuthenticatedContext } from "@/server/context";
import { decryptToken } from "@/server/integration-token-crypto";
import type { RcaSessionData } from "@/server/services/rca-service";

const logger = createLogger("rca.session");

const sessionCache = new WeakMap<
	Pick<AuthenticatedContext, "db" | "userId" | "services">,
	Promise<RcaSessionData | null>
>();

export async function getRcaSession(
	ctx: Pick<AuthenticatedContext, "db" | "userId" | "services">,
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

async function loadSession(
	ctx: Pick<AuthenticatedContext, "db" | "userId" | "services">,
): Promise<RcaSessionData | null> {
	const { db, userId, services } = ctx;
	const row = await db.athlete.findUnique({
		where: { userId },
		select: { rcaUsername: true, rcaPassword: true },
	});
	if (!row?.rcaUsername || !row.rcaPassword) {
		logger.info("no RCA credentials stored");
		return null;
	}
	const credentials = {
		username: decryptToken(row.rcaUsername),
		password: decryptToken(row.rcaPassword),
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
	userId,
}: Pick<AuthenticatedContext, "db" | "userId">): Promise<void> {
	await db.athlete.update({
		where: { userId },
		data: {
			rcaUsername: null,
			rcaPassword: null,
			rcaConnectedAt: null,
		},
	});
}
