import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/server/context";
import { getLeaderboardQuery } from "./get-leaderboard.query";

// Wednesday, mid-afternoon in Regina, so no activity sits near a day or week boundary.
const NOW = new Date("2026-06-17T20:00:00.000Z");

const RULES = [
	{
		groupId: "grp_masters",
		programId: "prog_masters",
		group: { name: "Masters" },
	},
	{
		groupId: "grp_juniors",
		programId: "prog_juniors",
		group: { name: "Juniors" },
	},
];

describe("getLeaderboardQuery", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each([
		["seven_days", 1000],
		["thirty_days", 4000],
		["three_months", 9000],
	] as const)("counts only the meters rowed in %s", async (period, meters) => {
		const athlete = createAthlete([
			activity({ daysAgo: 3, distance: 1000 }),
			activity({ daysAgo: 20, distance: 3000 }),
			activity({ daysAgo: 60, distance: 5000 }),
			activity({ daysAgo: 200, distance: 7000 }),
		]);

		const result = await getLeaderboardQuery(
			{ period },
			createContext([athlete]),
		);

		expect(result.data[0].meters).toBe(meters);
	});

	it.each([
		"seven_days",
		"thirty_days",
		"three_months",
	] as const)("keeps the all-time bests and the streak in %s", async (period) => {
		const athlete = createAthlete([
			activity({ daysAgo: 4, distance: 1000 }),
			activity({ daysAgo: 11, distance: 1000 }),
			activity({ daysAgo: 18, distance: 1000 }),
			activity({ daysAgo: 200, distance: 2000, elapsedTime: 4200 }),
			activity({ daysAgo: 200, distance: 6000, elapsedTime: 13800 }),
		]);

		const [row] = (
			await getLeaderboardQuery({ period }, createContext([athlete]))
		).data;

		expect(row.bestTwoKm).toBe(4200);
		expect(row.bestSixKm).toBe(13800);
		expect(row.streak).toBe(3);
	});

	it("ignores Concept2 interval sessions when picking the 2K and 6K bests", async () => {
		const athlete = createAthlete([
			activity({
				daysAgo: 10,
				distance: 2000,
				elapsedTime: 391000,
				conceptTwoData: {
					workout_type: "FixedDistanceInterval",
					workout: {
						intervals: [
							{ type: "distance", distance: 1000, time: 1950 },
							{ type: "distance", distance: 1000, time: 1960 },
						],
					},
				},
			}),
			activity({
				daysAgo: 12,
				distance: 2000,
				elapsedTime: 420000,
				conceptTwoData: { workout_type: "FixedDistanceSplits" },
			}),
			activity({
				daysAgo: 14,
				distance: 6000,
				elapsedTime: 1290000,
				conceptTwoData: {
					workout_type: "FixedDistanceInterval",
					workout: {
						intervals: [
							{ type: "distance", distance: 2000, time: 4300 },
							{ type: "distance", distance: 2000, time: 4310 },
							{ type: "distance", distance: 2000, time: 4290 },
						],
					},
				},
			}),
			activity({
				daysAgo: 16,
				distance: 6000,
				elapsedTime: 1380000,
				conceptTwoData: { workout_type: "FixedDistanceSplits" },
			}),
		]);

		const [row] = (
			await getLeaderboardQuery(
				{ period: "three_months" },
				createContext([athlete]),
			)
		).data;

		expect(row.bestTwoKm).toBe(420000);
		expect(row.bestSixKm).toBe(1380000);
	});

	it("ignores an interval session from a trimmed webhook payload", async () => {
		const athlete = createAthlete([
			activity({
				daysAgo: 10,
				distance: 2000,
				elapsedTime: 391000,
				conceptTwoData: { workout_type: "FixedDistanceInterval" },
			}),
			activity({ daysAgo: 12, distance: 2000, elapsedTime: 420000 }),
		]);

		const [row] = (
			await getLeaderboardQuery(
				{ period: "three_months" },
				createContext([athlete]),
			)
		).data;

		expect(row.bestTwoKm).toBe(420000);
	});

	it("lists the groups of the athlete's active programs instead of memberships", async () => {
		const [row] = (
			await getLeaderboardQuery(
				{ period: "three_months" },
				createContext([createAthlete([])]),
			)
		).data;

		expect(row.groups).toEqual([{ id: "grp_masters", name: "Masters" }]);
		expect(row).not.toHaveProperty("memberships");
		expect(row).not.toHaveProperty("activeMembership");
	});
});

function createContext(athletes: ReturnType<typeof createAthlete>[]) {
	const db = {
		athlete: {
			findMany: vi.fn(async () => athletes),
			count: vi.fn(async () => athletes.length),
		},
		group_program: {
			findMany: vi.fn(async () => RULES),
		},
	};
	return { db } as unknown as Context;
}

function createAthlete(activities: ReturnType<typeof activity>[]) {
	return {
		id: "ath_ann",
		userId: "user_ann",
		firstName: "Ann",
		lastName: "Lee",
		nickname: null,
		phone: "+13065550100",
		email: "ann@example.com",
		role: "member",
		gender: "female",
		dateOfBirth: new Date("1990-05-04"),
		dateJoined: new Date("2024-03-01"),
		heightInCm: null,
		weightInKg: null,
		memberships: [
			membership("mem_1", "prog_masters", "Masters", 2026),
			membership("mem_2", "prog_juniors", "Juniors", 2019),
		],
		activities,
	};
}

function membership(id: string, programId: string, name: string, year: number) {
	return {
		id,
		athleteId: "ath_ann",
		programId,
		program: {
			id: programId,
			name,
			description: null,
			startDate: new Date(`${year}-01-01`),
			endDate: new Date(`${year}-12-31`),
		},
	};
}

function activity({
	daysAgo,
	distance,
	elapsedTime = 600,
	conceptTwoData,
}: {
	daysAgo: number;
	distance: number;
	elapsedTime?: number;
	conceptTwoData?: unknown;
}) {
	return {
		distance,
		elapsedTime,
		type: "erg",
		startDate: new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000),
		conceptTwoData,
	};
}
