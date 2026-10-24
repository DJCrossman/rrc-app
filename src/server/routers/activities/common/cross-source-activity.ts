import type { Prisma } from "@/generated/prisma/client";

// A Concept2 result that the Logbook also pushes to Strava arrives twice — once
// per webhook. Strava's copy normally names the result in its upload file; when
// it doesn't (manual uploads, other apps), pair them on time and distance.

/**
 * The Concept2 result id behind a Strava activity uploaded by the Logbook,
 * which arrives as `device_name: "Concept2"`, `external_id: "122038081.fit"`.
 */
export function getConceptTwoIdFromStrava(activity: {
	device_name?: string | null;
	external_id?: string | null;
}): bigint | null {
	if (!activity.device_name?.toLowerCase().startsWith("concept2")) return null;
	const match = activity.external_id?.match(/^(\d+)(?:\.fit)?$/i);
	return match ? BigInt(match[1]) : null;
}

// Concept2 dates are minute-precision and may mark either the start or the end
// of the piece, so allow a few minutes of slack against either boundary.
const MAX_TIME_DIFF_MS = 5 * 60 * 1000;
// Strava's distance includes metres rowed during rest intervals; Concept2's
// does not. Rest distance is small relative to the work distance.
const MAX_DISTANCE_DIFF_RATIO = 0.1;
const MIN_DISTANCE_DIFF_M = 100;
// How far around a batch's start dates to look for a counterpart.
export const CROSS_SOURCE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CrossSourceShape = {
	startDate: Date;
	// Milliseconds.
	elapsedTime: number;
	// Metres.
	distance: number;
};

function timeDiff({
	a,
	b,
}: {
	a: CrossSourceShape;
	b: CrossSourceShape;
}): number {
	const aStart = a.startDate.getTime();
	const bStart = b.startDate.getTime();
	const aEnd = aStart + a.elapsedTime;
	const bEnd = bStart + b.elapsedTime;
	return Math.min(
		Math.abs(aStart - bStart),
		Math.abs(aStart - bEnd),
		Math.abs(aEnd - bStart),
	);
}

function distanceMatches({ a, b }: { a: number; b: number }): boolean {
	const tolerance = Math.max(
		Math.max(a, b) * MAX_DISTANCE_DIFF_RATIO,
		MIN_DISTANCE_DIFF_M,
	);
	return Math.abs(a - b) <= tolerance;
}

/**
 * Returns the candidate recorded by the other integration that most likely is
 * the same piece as `target`, or undefined when none is close enough.
 */
export function findCrossSourceMatch<T extends CrossSourceShape>({
	target,
	candidates,
}: {
	target: CrossSourceShape;
	candidates: readonly T[];
}): T | undefined {
	let best: { candidate: T; time: number; distance: number } | undefined;
	for (const candidate of candidates) {
		const time = timeDiff({ a: target, b: candidate });
		if (time > MAX_TIME_DIFF_MS) continue;
		if (!distanceMatches({ a: target.distance, b: candidate.distance }))
			continue;
		const distance = Math.abs(target.distance - candidate.distance);
		if (
			!best ||
			time < best.time ||
			(time === best.time && distance < best.distance)
		) {
			best = { candidate, time, distance };
		}
	}
	return best?.candidate;
}

export function crossSourceWindow(dates: readonly Date[]) {
	const times = dates.map((d) => d.getTime());
	return {
		gte: new Date(Math.min(...times) - CROSS_SOURCE_WINDOW_MS),
		lte: new Date(Math.max(...times) + CROSS_SOURCE_WINDOW_MS),
	};
}

/**
 * Serialises activity writes for one athlete until the surrounding transaction
 * ends. Strava and Concept2 webhooks for the same piece usually land within
 * seconds of each other; without this both see "no counterpart yet" and each
 * inserts its own row.
 */
export async function lockAthleteActivities({
	tx,
	athleteId,
}: {
	tx: Prisma.TransactionClient;
	athleteId: string;
}) {
	await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`activity:${athleteId}`}))`;
}
