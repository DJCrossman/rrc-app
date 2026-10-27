import { describe, expect, it } from "vitest";
import { computeWeekTotals, toPercent } from "./computeWeekTotals";

const row = (
	overrides: Partial<Parameters<typeof computeWeekTotals>[0][number]> = {},
) => ({
	dayIndex: 0,
	activityType: "water" as const,
	intensityCategory: "C6" as const,
	durationMin: 60,
	distanceMeters: 15000,
	...overrides,
});

describe("computeWeekTotals", () => {
	it("returns zeroed totals for an empty week", () => {
		const totals = computeWeekTotals([]);
		expect(totals.total).toEqual({ minutes: 0, meters: 0 });
		expect(totals.sessionCount).toBe(0);
		expect(totals.byDay).toHaveLength(7);
		expect(totals.byDay.every((d) => d.minutes === 0 && d.meters === 0)).toBe(
			true,
		);
		expect(totals.byMode.water).toEqual({ minutes: 0, meters: 0 });
		expect(totals.byZone.C1).toEqual({ minutes: 0, meters: 0 });
	});

	it("sums minutes and metres across sessions", () => {
		const totals = computeWeekTotals([
			row({ durationMin: 90, distanceMeters: 20000 }),
			row({ durationMin: 60, distanceMeters: 12000 }),
		]);
		expect(totals.total).toEqual({ minutes: 150, meters: 32000 });
		expect(totals.sessionCount).toBe(2);
	});

	it("splits totals by mode", () => {
		const totals = computeWeekTotals([
			row({ activityType: "water", durationMin: 90, distanceMeters: 20000 }),
			row({ activityType: "erg", durationMin: 60, distanceMeters: 14000 }),
			row({
				activityType: "strength",
				durationMin: 45,
				distanceMeters: undefined,
			}),
			row({
				activityType: "crossTrain",
				durationMin: 30,
				distanceMeters: 8000,
			}),
		]);
		expect(totals.byMode.water).toEqual({ minutes: 90, meters: 20000 });
		expect(totals.byMode.erg).toEqual({ minutes: 60, meters: 14000 });
		expect(totals.byMode.strength).toEqual({ minutes: 45, meters: 0 });
		expect(totals.byMode.crossTrain).toEqual({ minutes: 30, meters: 8000 });
	});

	it("splits both minutes and metres by intensity zone", () => {
		const totals = computeWeekTotals([
			row({ intensityCategory: "C6", durationMin: 90, distanceMeters: 20000 }),
			row({ intensityCategory: "C6", durationMin: 60, distanceMeters: 15000 }),
			row({ intensityCategory: "C2", durationMin: 30, distanceMeters: 9000 }),
		]);
		expect(totals.byZone.C6).toEqual({ minutes: 150, meters: 35000 });
		expect(totals.byZone.C2).toEqual({ minutes: 30, meters: 9000 });
		expect(totals.byZone.C4).toEqual({ minutes: 0, meters: 0 });
	});

	it("produces per-day subtotals", () => {
		const totals = computeWeekTotals([
			row({ dayIndex: 0, durationMin: 60, distanceMeters: 12000 }),
			row({ dayIndex: 0, durationMin: 30, distanceMeters: 6000 }),
			row({ dayIndex: 6, durationMin: 45, distanceMeters: 10000 }),
		]);
		expect(totals.byDay[0]).toEqual({ minutes: 90, meters: 18000 });
		expect(totals.byDay[6]).toEqual({ minutes: 45, meters: 10000 });
		expect(totals.byDay[3]).toEqual({ minutes: 0, meters: 0 });
	});

	it("treats missing duration and distance as zero", () => {
		const totals = computeWeekTotals([
			row({ durationMin: undefined, distanceMeters: undefined }),
		]);
		expect(totals.total).toEqual({ minutes: 0, meters: 0 });
		expect(totals.sessionCount).toBe(1);
	});

	it("splits a session across the zones its composition names", () => {
		const totals = computeWeekTotals([
			row({
				durationMin: 80,
				distanceMeters: undefined,
				zoneC6: 30,
				zoneC5: 30,
				zoneC4: 20,
			}),
		]);
		expect(totals.byZone.C6.minutes).toBe(30);
		expect(totals.byZone.C5.minutes).toBe(30);
		expect(totals.byZone.C4.minutes).toBe(20);
		expect(totals.composedMinutes).toBe(80);
		expect(totals.total.minutes).toBe(80);
	});

	it("apportions a composed session's distance across its zones", () => {
		const totals = computeWeekTotals([
			row({ durationMin: 80, distanceMeters: 16_000, zoneC6: 60, zoneC5: 20 }),
		]);
		expect(totals.byZone.C6.meters).toBe(12_000);
		expect(totals.byZone.C5.meters).toBe(4_000);
	});

	it("falls back to the headline zone when a session has no composition", () => {
		const totals = computeWeekTotals([
			row({ intensityCategory: "C5", durationMin: 60, distanceMeters: 12_000 }),
		]);
		expect(totals.byZone.C5).toEqual({ minutes: 60, meters: 12_000 });
		expect(totals.composedMinutes).toBe(60);
	});

	it("keeps uncomposed strength work out of the zone block", () => {
		const totals = computeWeekTotals([
			row({
				activityType: "strength",
				durationMin: 120,
				distanceMeters: undefined,
			}),
		]);
		expect(totals.total.minutes).toBe(120);
		expect(totals.byMode.strength.minutes).toBe(120);
		expect(totals.composedMinutes).toBe(0);
		expect(totals.byZone.C6.minutes).toBe(0);
	});

	it("reproduces week 20 of the coach's sheet", () => {
		// Week 20: ROW 510, ERG 140, XT 90, S&C 300 = 1040 min; composition
		// 710 C6 (their SS + C6), 20 C5, 4 C4, 3 C3, 3 C2 = 740 min.
		const session = (
			mode: "water" | "erg" | "crossTrain" | "strength",
			durationMin: number,
			zones: Partial<
				Record<"zoneC6" | "zoneC5" | "zoneC4" | "zoneC3" | "zoneC2", number>
			>,
		) =>
			row({
				activityType: mode,
				durationMin,
				distanceMeters: undefined,
				...zones,
			});

		const totals = computeWeekTotals([
			session("water", 80, { zoneC6: 80 }),
			session("water", 70, { zoneC6: 70 }),
			session("strength", 120, {}),
			session("water", 90, { zoneC6: 90 }),
			session("erg", 70, { zoneC6: 70 }),
			session("water", 80, { zoneC6: 60, zoneC5: 20 }),
			session("strength", 120, {}),
			session("water", 90, { zoneC6: 90 }),
			session("water", 100, { zoneC6: 100 }),
			session("strength", 60, {}),
			session("erg", 70, { zoneC6: 60, zoneC4: 4, zoneC3: 3, zoneC2: 3 }),
			session("crossTrain", 90, { zoneC6: 90 }),
		]);

		expect(totals.byMode.water.minutes).toBe(510);
		expect(totals.byMode.erg.minutes).toBe(140);
		expect(totals.byMode.crossTrain.minutes).toBe(90);
		expect(totals.byMode.strength.minutes).toBe(300);
		expect(totals.total.minutes).toBe(1040);

		expect(totals.composedMinutes).toBe(740);
		expect(totals.byZone.C6.minutes).toBe(710);
		expect(totals.byZone.C5.minutes).toBe(20);
		expect(totals.byZone.C4.minutes).toBe(4);
		expect(totals.byZone.C3.minutes).toBe(3);
		expect(totals.byZone.C2.minutes).toBe(3);
		expect(totals.byZone.C1.minutes).toBe(0);

		// The coach's "% of Wk" and "SS/C6" figures.
		expect(
			toPercent(totals.byMode.water.minutes, totals.total.minutes),
		).toBeCloseTo(49.04, 2);
		expect(
			toPercent(totals.byZone.C6.minutes, totals.composedMinutes),
		).toBeCloseTo(95.95, 2);
		expect(
			toPercent(totals.byZone.C5.minutes, totals.composedMinutes),
		).toBeCloseTo(2.7, 2);
	});

	it("ignores day subtotals for out-of-range day indexes", () => {
		const totals = computeWeekTotals([row({ dayIndex: 9, durationMin: 60 })]);
		expect(totals.total.minutes).toBe(60);
		expect(totals.byDay.every((d) => d.minutes === 0)).toBe(true);
	});
});

describe("toPercent", () => {
	it("computes a share of the whole", () => {
		expect(toPercent(25, 100)).toBe(25);
		expect(toPercent(1, 3)).toBeCloseTo(33.333, 3);
	});

	it("returns zero when the whole is zero or negative", () => {
		expect(toPercent(10, 0)).toBe(0);
		expect(toPercent(10, -5)).toBe(0);
	});
});
