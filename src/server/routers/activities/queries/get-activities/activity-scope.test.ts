import { describe, expect, it } from "vitest";
import { resolveActivityAthleteId } from "./activity-scope";

describe("resolveActivityAthleteId", () => {
	it("always scopes a member to their own activities", () => {
		expect(
			resolveActivityAthleteId({
				isAdmin: false,
				currentAthleteId: "ath_me",
				requestedAthleteId: "ath_other",
			}),
		).toBe("ath_me");
	});

	it("rejects a member without an athlete row", () => {
		expect(() =>
			resolveActivityAthleteId({ isAdmin: false, currentAthleteId: null }),
		).toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
	});

	it("lets an admin look at a requested athlete, else their own", () => {
		expect(
			resolveActivityAthleteId({
				isAdmin: true,
				currentAthleteId: "ath_me",
				requestedAthleteId: "ath_other",
			}),
		).toBe("ath_other");
		expect(
			resolveActivityAthleteId({ isAdmin: true, currentAthleteId: "ath_me" }),
		).toBe("ath_me");
	});

	it("shows an admin without an athlete row every activity", () => {
		expect(
			resolveActivityAthleteId({ isAdmin: true, currentAthleteId: null }),
		).toBeUndefined();
	});
});
