import type { Prisma } from "@/generated/prisma/client";

/** Parses a stored integration payload, treating JSON nulls as absent. */
export function parseStoredJson<T>({
	schema,
	raw,
}: {
	schema: { safeParse: (raw: unknown) => { success: boolean; data?: T } };
	raw: Prisma.JsonValue;
}): T | undefined {
	if (!raw) return undefined;
	const normalized = JSON.parse(
		JSON.stringify(raw, (_key, value) => (value === null ? undefined : value)),
	);
	return schema.safeParse(normalized).data;
}

// A Concept2 result that the Logbook also pushes to Strava arrives twice — once
// per webhook. Strava's copy normally names the result in its upload file; when
// it doesn't (manual uploads, other apps), pair them on length and distance.

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

// Without an id, the piece's length is the fingerprint: Strava's elapsed time
// equals Concept2's work + rest time, except that Strava drops the final rest.
// The Logbook names the Strava copy after the workout ("3x20:00/2:00r row"),
// so the title tells us how long that rest was.
const MAX_LENGTH_DIFF_MS = 10 * 1000;
// Strava's distance includes metres rowed during rest intervals; Concept2's
// does not. Rest distance is small relative to the work distance.
const MAX_DISTANCE_DIFF_RATIO = 0.1;
const MIN_DISTANCE_DIFF_M = 100;
// Only pair pieces from the same session, so the same workout rowed on two
// different days never matches. Concept2 dates mark the end of the piece, so
// this is deliberately loose.
export const CROSS_SOURCE_WINDOW_MS = 3 * 60 * 60 * 1000;

export type CrossSourceShape = {
	startDate: Date;
	// Total length including rest, in milliseconds.
	lengthMs: number;
	// Metres.
	distance: number;
	// A rest interval the other side may have dropped, in milliseconds.
	restAllowanceMs: number;
};

export function concept2MatchShape({
	startDate,
	result,
}: {
	startDate: Date;
	result: { time: number; rest_time?: number | null; distance: number };
}): CrossSourceShape {
	return {
		startDate,
		// Concept2 times are in deciseconds.
		lengthMs: (result.time + (result.rest_time ?? 0)) * 100,
		distance: result.distance,
		restAllowanceMs: 0,
	};
}

export function stravaMatchShape({
	startDate,
	activity,
}: {
	startDate: Date;
	activity: { elapsed_time: number; distance: number; name: string };
}): CrossSourceShape {
	return {
		startDate,
		lengthMs: activity.elapsed_time * 1000,
		distance: activity.distance,
		restAllowanceMs: getFinalRestFromTitle(activity.name),
	};
}

/** The last rest named in a Logbook title, e.g. "3x20:00/2:00r row" → 2:00. */
function getFinalRestFromTitle(title: string): number {
	const rests = [...title.matchAll(/(\d+):(\d{2})r\b/g)];
	const last = rests.at(-1);
	if (!last) return 0;
	return (Number(last[1]) * 60 + Number(last[2])) * 1000;
}

function lengthDiff({
	a,
	b,
}: {
	a: CrossSourceShape;
	b: CrossSourceShape;
}): number {
	const diff = Math.abs(a.lengthMs - b.lengthMs);
	const rest = Math.max(a.restAllowanceMs, b.restAllowanceMs);
	return Math.min(diff, Math.abs(diff - rest));
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
	let best: { candidate: T; length: number; time: number } | undefined;
	for (const candidate of candidates) {
		const time = Math.abs(
			target.startDate.getTime() - candidate.startDate.getTime(),
		);
		if (time > CROSS_SOURCE_WINDOW_MS) continue;
		if (!distanceMatches({ a: target.distance, b: candidate.distance }))
			continue;
		const length = lengthDiff({ a: target, b: candidate });
		if (length > MAX_LENGTH_DIFF_MS) continue;
		if (
			!best ||
			length < best.length ||
			(length === best.length && time < best.time)
		) {
			best = { candidate, length, time };
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
