import { describe, expect, it } from "vitest";
import {
	isCoach,
	isProgramActive,
	type ProgramWindow,
	resolveAthleteGroupIds,
	resolveGroupMemberIds,
} from "./group-membership";

const TODAY = "2026-10-23";

const window = (startDate: string | null, endDate: string | null) => ({
	startDate: startDate ? new Date(startDate) : null,
	endDate: endDate ? new Date(endDate) : null,
});

const current = window("2026-01-01", "2026-12-31");
const expired = window("2025-01-01", "2025-12-31");

const membership = (
	athleteId: string,
	programId: string,
	program: ProgramWindow = current,
) => ({ athleteId, programId, program });

describe("isProgramActive", () => {
	it("is active when today falls inside the program dates", () => {
		expect(isProgramActive(current, TODAY)).toBe(true);
	});

	it("includes the first and last day of the program", () => {
		expect(isProgramActive(window(TODAY, "2026-12-31"), TODAY)).toBe(true);
		expect(isProgramActive(window("2026-01-01", TODAY), TODAY)).toBe(true);
	});

	it("is inactive before the start date or after the end date", () => {
		expect(isProgramActive(window("2026-10-24", null), TODAY)).toBe(false);
		expect(isProgramActive(window(null, "2026-10-22"), TODAY)).toBe(false);
		expect(isProgramActive(expired, TODAY)).toBe(false);
	});

	it("treats missing dates as open-ended", () => {
		expect(isProgramActive(window(null, null), TODAY)).toBe(true);
		expect(isProgramActive(window("2026-01-01", null), TODAY)).toBe(true);
		expect(isProgramActive(window(null, "2026-12-31"), TODAY)).toBe(true);
	});
});

describe("resolveGroupMemberIds", () => {
	it("includes athletes with an active membership in one of the group's programs", () => {
		const memberIds = resolveGroupMemberIds({
			programIds: ["prog_masters"],
			memberships: [
				membership("ath_ann", "prog_masters"),
				membership("ath_old", "prog_masters", expired),
				membership("ath_jr", "prog_juniors"),
			],
			today: TODAY,
		});

		expect(memberIds).toEqual(["ath_ann"]);
	});

	it("lists an athlete once when several memberships qualify", () => {
		const memberIds = resolveGroupMemberIds({
			programIds: ["prog_masters", "prog_competitive"],
			memberships: [
				membership("ath_ann", "prog_masters"),
				membership("ath_ann", "prog_competitive"),
				membership("ath_bo", "prog_masters", expired),
				membership("ath_bo", "prog_competitive"),
			],
			today: TODAY,
		});

		expect(memberIds.sort()).toEqual(["ath_ann", "ath_bo"]);
	});

	it("is empty when the group has no programs", () => {
		expect(
			resolveGroupMemberIds({
				programIds: [],
				memberships: [membership("ath_ann", "prog_masters")],
				today: TODAY,
			}),
		).toEqual([]);
	});
});

describe("resolveAthleteGroupIds", () => {
	const groupPrograms = [
		{ groupId: "grp_masters", programId: "prog_masters" },
		{ groupId: "grp_competitive", programId: "prog_competitive" },
		{ groupId: "grp_everyone", programId: "prog_masters" },
		{ groupId: "grp_everyone", programId: "prog_competitive" },
	];

	it("joins every group with a rule for one of the athlete's active programs", () => {
		const groupIds = resolveAthleteGroupIds({
			memberships: [
				{ programId: "prog_masters", program: current },
				{ programId: "prog_competitive", program: expired },
			],
			groupPrograms,
			today: TODAY,
		});

		expect(groupIds.sort()).toEqual(["grp_everyone", "grp_masters"]);
	});

	it("returns no groups for an athlete without active memberships", () => {
		expect(
			resolveAthleteGroupIds({
				memberships: [{ programId: "prog_masters", program: expired }],
				groupPrograms,
				today: TODAY,
			}),
		).toEqual([]);
	});
});

describe("isCoach", () => {
	const program = (name: string, dates: ProgramWindow = current) => ({
		program: { name, ...dates },
	});

	it("is true for admins regardless of memberships", () => {
		expect(isCoach({ role: "admin", memberships: [] }, TODAY)).toBe(true);
	});

	it("is true for an active membership whose program name contains coach", () => {
		expect(
			isCoach({ role: "member", memberships: [program("Coach")] }, TODAY),
		).toBe(true);
		expect(
			isCoach(
				{ role: "member", memberships: [program("2026 Club COACHING")] },
				TODAY,
			),
		).toBe(true);
	});

	it("is false when the coach membership is not active", () => {
		expect(
			isCoach(
				{ role: "member", memberships: [program("Coach", expired)] },
				TODAY,
			),
		).toBe(false);
	});

	it("is false for members without a coach program", () => {
		expect(
			isCoach({ role: "member", memberships: [program("Masters")] }, TODAY),
		).toBe(false);
	});
});
