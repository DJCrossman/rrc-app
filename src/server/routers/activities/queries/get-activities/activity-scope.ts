import { TRPCError } from "@trpc/server";

export function resolveActivityAthleteId({
	isAdmin,
	currentAthleteId,
	requestedAthleteId,
}: {
	isAdmin: boolean;
	currentAthleteId: string | null;
	requestedAthleteId?: string;
}): string | undefined {
	if (isAdmin) return requestedAthleteId ?? currentAthleteId ?? undefined;
	if (!currentAthleteId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Athlete account required",
		});
	}
	return currentAthleteId;
}
