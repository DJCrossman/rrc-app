import { describe, expect, it } from "vitest";
import {
	findCrossSourceMatch,
	getConceptTwoIdFromStrava,
} from "./cross-source-activity";

const minutes = (n: number) => n * 60 * 1000;
const at = (iso: string) => new Date(iso);

describe("findCrossSourceMatch", () => {
	// Strava's copy of a Concept2 interval piece: includes rest time/distance.
	const strava = {
		startDate: at("2026-10-23T14:00:00Z"),
		elapsedTime: minutes(64),
		distance: 13_553,
	};

	it("pairs a Concept2 result that starts with the Strava activity", () => {
		const concept2 = {
			id: "c2",
			startDate: at("2026-10-23T14:00:00Z"),
			elapsedTime: minutes(60),
			distance: 13_436,
		};
		expect(findCrossSourceMatch(strava, [concept2])).toBe(concept2);
	});

	it("pairs a Concept2 result stamped at the end of the piece", () => {
		const concept2 = {
			id: "c2",
			startDate: at("2026-10-23T15:04:00Z"),
			elapsedTime: minutes(60),
			distance: 13_436,
		};
		expect(findCrossSourceMatch(strava, [concept2])).toBe(concept2);
	});

	it("tells a warm-up apart from the main piece rowed right after it", () => {
		const warmup = {
			id: "warmup",
			startDate: at("2026-10-14T13:45:00Z"),
			elapsedTime: minutes(15),
			distance: 3_322,
		};
		const main = {
			id: "main",
			startDate: at("2026-10-14T14:00:00Z"),
			elapsedTime: minutes(44),
			distance: 9_648,
		};
		const stravaMain = {
			startDate: at("2026-10-14T14:00:30Z"),
			elapsedTime: minutes(44),
			distance: 9_626,
		};
		const stravaWarmup = {
			startDate: at("2026-10-14T13:45:00Z"),
			elapsedTime: minutes(15),
			distance: 3_322,
		};
		expect(findCrossSourceMatch(stravaMain, [warmup, main])).toBe(main);
		expect(findCrossSourceMatch(stravaWarmup, [warmup, main])).toBe(warmup);
	});

	it("rejects candidates too far apart in time", () => {
		const concept2 = {
			id: "c2",
			startDate: at("2026-10-23T18:00:00Z"),
			elapsedTime: minutes(60),
			distance: 13_436,
		};
		expect(findCrossSourceMatch(strava, [concept2])).toBeUndefined();
	});

	it("rejects candidates with a different distance", () => {
		const concept2 = {
			id: "c2",
			startDate: at("2026-10-23T14:00:00Z"),
			elapsedTime: minutes(60),
			distance: 6_000,
		};
		expect(findCrossSourceMatch(strava, [concept2])).toBeUndefined();
	});
});

describe("getConceptTwoIdFromStrava", () => {
	it("reads the result id from a Logbook upload", () => {
		expect(
			getConceptTwoIdFromStrava({
				device_name: "Concept2",
				external_id: "122038081.fit",
			}),
		).toBe(BigInt(122038081));
	});

	it("ignores uploads from other devices", () => {
		expect(
			getConceptTwoIdFromStrava({
				device_name: "Garmin Forerunner",
				external_id: "122038081.fit",
			}),
		).toBeNull();
	});

	it("ignores external ids that aren't a result id", () => {
		expect(
			getConceptTwoIdFromStrava({
				device_name: "Concept2",
				external_id: "garmin_push_12345",
			}),
		).toBeNull();
		expect(getConceptTwoIdFromStrava({ device_name: "Concept2" })).toBeNull();
	});
});
