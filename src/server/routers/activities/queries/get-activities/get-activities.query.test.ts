import { describe, expect, it, vi } from "vitest";
import type { Context } from "@/server/context";
import { getActivitiesQuery } from "./get-activities.query";

describe("getActivitiesQuery", () => {
	it("keeps a plain 2K and drops a 2K interval session", async () => {
		const { db, ctx } = createContext([
			{
				id: "act_plain",
				type: "erg",
				distance: 2000,
				conceptTwoData: { workout_type: "FixedDistanceSplits" },
			},
			{
				id: "act_interval",
				type: "erg",
				distance: 2000,
				conceptTwoData: { workout_type: "FixedDistanceInterval" },
			},
		]);

		await getActivitiesQuery({ ergTest: "2k", athleteIds: ["ath_me"] }, ctx);

		expect(db.activity.findMany).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				where: {
					athleteId: { in: ["ath_me"] },
					type: "erg",
					distance: 2000,
				},
			}),
		);
		expect(db.activity.findMany).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				where: {
					athleteId: { in: ["ath_me"] },
					id: { in: ["act_plain"] },
				},
			}),
		);
		expect(db.activity.count).toHaveBeenCalledWith({
			where: { athleteId: { in: ["ath_me"] }, id: { in: ["act_plain"] } },
		});
	});

	it("skips the erg test lookup without an erg test filter", async () => {
		const { db, ctx } = createContext([]);

		await getActivitiesQuery({ athleteIds: ["ath_me"] }, ctx);

		expect(db.activity.findMany).toHaveBeenCalledTimes(1);
		expect(db.activity.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { athleteId: { in: ["ath_me"] } } }),
		);
	});
});

function createContext(ergTestCandidates: unknown[]) {
	const db = {
		activity: {
			findMany: vi
				.fn()
				.mockResolvedValueOnce(ergTestCandidates)
				.mockResolvedValue([]),
			count: vi.fn(async () => 0),
		},
	};
	return { db, ctx: { db } as unknown as Context };
}
