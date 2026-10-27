import { TRPCError } from "@trpc/server";
import type { ContextAthlete, SessionUser } from "../context";

export function resolveViewerAccess<TAthlete extends ContextAthlete | null>({
	user,
	athlete,
}: {
	user: SessionUser | null;
	athlete: TAthlete;
}): { user: SessionUser; athlete: TAthlete } {
	if (!user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	if (!athlete && !user.isAdmin) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Athlete account required",
		});
	}
	return { user, athlete };
}
