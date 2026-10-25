import { describe, expect, it } from "vitest";
import {
	concept2MatchShape,
	findCrossSourceMatch,
	getConceptTwoIdFromStrava,
	stravaMatchShape,
} from "./cross-source-activity";

// Real Concept2 ↔ Strava pairs from production. Concept2 stamps the finish
// time; Strava the start.
const pairs = [
	{
		title: "v15:00/3:01r...4 row",
		concept2: {
			date: "2026-10-24T14:17:00Z",
			time: 19500,
			rest_time: 7220,
			distance: 7497,
		},
		strava: {
			start: "2026-10-24T13:32:29Z",
			elapsed_time: 2669,
			distance: 7645,
		},
	},
	{
		title: "Warm up",
		concept2: { date: "2026-10-24T13:28:00Z", time: 4547, distance: 1505 },
		strava: {
			start: "2026-10-24T13:20:25Z",
			elapsed_time: 455,
			distance: 1505,
		},
	},
	{
		title: "3x20:00/2:00r row",
		concept2: {
			date: "2026-10-23T13:16:00Z",
			time: 36000,
			rest_time: 3600,
			distance: 13436,
		},
		strava: {
			start: "2026-10-23T12:10:00Z",
			elapsed_time: 3841,
			distance: 13553,
		},
	},
	{
		title: "2x21:00/2:00r row",
		concept2: { date: "2026-10-14T13:08:00Z", time: 27600, distance: 9648 },
		strava: {
			start: "2026-10-14T12:22:01Z",
			elapsed_time: 2641,
			distance: 9626,
		},
	},
	{
		title: "Warm up",
		concept2: { date: "2026-10-14T12:22:00Z", time: 9000, distance: 3322 },
		strava: {
			start: "2026-10-14T12:07:00Z",
			elapsed_time: 900,
			distance: 3322,
		},
	},
	{
		title: "30:00 row",
		concept2: { date: "2026-10-11T22:09:00Z", time: 18000, distance: 6801 },
		strava: {
			start: "2026-10-11T21:39:00Z",
			elapsed_time: 1800,
			distance: 6801,
		},
	},
	{
		title: "v3:00/2:00r...6 row",
		concept2: { date: "2026-09-30T12:45:00Z", time: 18000, distance: 6107 },
		strava: {
			start: "2026-09-30T12:15:02Z",
			elapsed_time: 1798,
			distance: 6091,
		},
	},
];

const concept2Shapes = pairs.map(({ concept2 }) => ({
	id: concept2.date,
	...concept2MatchShape({
		startDate: new Date(concept2.date),
		result: concept2,
	}),
}));
const stravaShape = ({ title, strava }: (typeof pairs)[number]) =>
	stravaMatchShape({
		startDate: new Date(strava.start),
		activity: { ...strava, name: title },
	});

describe("findCrossSourceMatch", () => {
	it.each(pairs)("pairs $title with its Concept2 result", (pair) => {
		expect(
			findCrossSourceMatch({
				target: stravaShape(pair),
				candidates: concept2Shapes,
			})?.id,
		).toBe(pair.concept2.date);
	});

	it("uses the title's rest to bridge the final rest Strava drops", () => {
		const pair = pairs[2];
		expect(
			findCrossSourceMatch({
				target: stravaShape({ ...pair, title: "Morning Row" }),
				candidates: concept2Shapes,
			}),
		).toBeUndefined();
	});

	it("never pairs the same workout rowed on another day", () => {
		const pair = pairs[5];
		const nextDay = {
			...pair,
			strava: { ...pair.strava, start: "2026-10-12T21:39:00Z" },
		};
		expect(
			findCrossSourceMatch({
				target: stravaShape(nextDay),
				candidates: concept2Shapes,
			}),
		).toBeUndefined();
	});

	it("tells two equal-distance pieces in one session apart by length", () => {
		const first = {
			id: "first",
			...concept2MatchShape({
				startDate: new Date("2026-11-01T12:07:00Z"),
				result: { time: 4200, distance: 2000 },
			}),
		};
		const second = {
			id: "second",
			...concept2MatchShape({
				startDate: new Date("2026-11-01T12:20:00Z"),
				result: { time: 4290, distance: 2000 },
			}),
		};
		const target = stravaMatchShape({
			startDate: new Date("2026-11-01T12:12:00Z"),
			activity: { name: "2000m row", elapsed_time: 429, distance: 2000 },
		});
		expect(
			findCrossSourceMatch({ target, candidates: [first, second] })?.id,
		).toBe("second");
	});

	it("rejects candidates with a different distance", () => {
		const pair = pairs[5];
		expect(
			findCrossSourceMatch({
				target: stravaShape({
					...pair,
					strava: { ...pair.strava, distance: 5000 },
				}),
				candidates: concept2Shapes,
			}),
		).toBeUndefined();
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
		expect(
			getConceptTwoIdFromStrava({ device_name: "Concept2", external_id: null }),
		).toBeNull();
	});
});
