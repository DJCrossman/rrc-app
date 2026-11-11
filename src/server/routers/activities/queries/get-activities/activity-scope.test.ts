import { describe, expect, it } from "vitest";
import { resolveActivityAthleteIds } from "./activity-scope";

describe("resolveActivityAthleteIds", () => {
	it("always scopes a member to their own activities", () => {
		expect(
			resolveActivityAthleteIds({
				isAdmin: false,
				currentAthleteId: "ath_me",
				requestedAthleteIds: ["ath_other"],
			}),
		).toEqual(["ath_me"]);
	});

	it("rejects a member without an athlete row", () => {
		expect(() =>
			resolveActivityAthleteIds({ isAdmin: false, currentAthleteId: null }),
		).toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
	});

	it("lets an admin look at a requested athlete, else everyone", () => {
		expect(
			resolveActivityAthleteIds({
				isAdmin: true,
				currentAthleteId: "ath_me",
				requestedAthleteIds: ["ath_other"],
			}),
		).toEqual(["ath_other"]);
		expect(
			resolveActivityAthleteIds({ isAdmin: true, currentAthleteId: "ath_me" }),
		).toBeUndefined();
	});

	it("shows an admin without an athlete row every activity", () => {
		expect(
			resolveActivityAthleteIds({ isAdmin: true, currentAthleteId: null }),
		).toBeUndefined();
	});

	it("lets an admin look at several requested athletes", () => {
		expect(
			resolveActivityAthleteIds({
				isAdmin: true,
				currentAthleteId: "ath_me",
				requestedAthleteIds: ["ath_a", "ath_b"],
			}),
		).toEqual(["ath_a", "ath_b"]);
	});

	it("shows an admin who requests an empty list every activity", () => {
		expect(
			resolveActivityAthleteIds({
				isAdmin: true,
				currentAthleteId: "ath_me",
				requestedAthleteIds: [],
			}),
		).toBeUndefined();
	});

	it("scopes a member to their own activities whoever else they request", () => {
		expect(
			resolveActivityAthleteIds({
				isAdmin: false,
				currentAthleteId: "ath_me",
				requestedAthleteIds: ["ath_a", "ath_b"],
			}),
		).toEqual(["ath_me"]);
		expect(
			resolveActivityAthleteIds({
				isAdmin: false,
				currentAthleteId: "ath_me",
				requestedAthleteIds: ["ath_other", "ath_me"],
			}),
		).toEqual(["ath_me"]);
	});
});
