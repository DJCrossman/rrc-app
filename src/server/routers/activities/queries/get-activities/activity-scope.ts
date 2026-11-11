import { TRPCError } from "@trpc/server";

export function resolveActivityAthleteIds({
	isAdmin,
	currentAthleteId,
	requestedAthleteIds,
}: {
	isAdmin: boolean;
	currentAthleteId: string | null;
	requestedAthleteIds?: string[];
}): string[] | undefined {
	if (isAdmin) {
		return requestedAthleteIds?.length ? requestedAthleteIds : undefined;
	}
	if (!currentAthleteId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Athlete account required",
		});
	}
	return [currentAthleteId];
}
