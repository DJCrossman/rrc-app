import { describe, expect, it } from "vitest";
import type { AthleteRow } from "./map-to-athlete-dto";
import { mapToAthleteWithGroups } from "./map-to-athlete-with-groups";

const program = (id: string, name: string, year: number) => ({
	id,
	name,
	description: null,
	startDate: new Date(`${year}-01-01`),
	endDate: new Date(`${year}-12-31`),
});

const row = {
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
		{
			id: "mem_1",
			athleteId: "ath_ann",
			programId: "prog_masters",
			program: program("prog_masters", "Masters", new Date().getFullYear()),
		},
		{
			id: "mem_2",
			athleteId: "ath_ann",
			programId: "prog_juniors",
			program: program("prog_juniors", "Juniors", 2019),
		},
	],
} as unknown as AthleteRow;

const rules = [
	{
		groupId: "grp_masters",
		programId: "prog_masters",
		group: { name: "Masters" },
	},
	{
		groupId: "grp_all",
		programId: "prog_masters",
		group: { name: "All rowers" },
	},
	{
		groupId: "grp_all",
		programId: "prog_juniors",
		group: { name: "All rowers" },
	},
	{
		groupId: "grp_juniors",
		programId: "prog_juniors",
		group: { name: "Juniors" },
	},
];

describe("mapToAthleteWithGroups", () => {
	it("keeps the athlete fields and exposes the Clerk user id", () => {
		const member = mapToAthleteWithGroups(row, rules);

		expect(member.id).toBe("ath_ann");
		expect(member.userId).toBe("user_ann");
		expect(member.name).toBe("Ann");
		expect(member.activeMembership?.name).toBe("Masters");
	});

	it("lists each group once, by name, from the athlete's active programs", () => {
		expect(mapToAthleteWithGroups(row, rules).groups).toEqual([
			{ id: "grp_all", name: "All rowers" },
			{ id: "grp_masters", name: "Masters" },
		]);
	});

	it("has no groups when no rule matches", () => {
		expect(mapToAthleteWithGroups(row, []).groups).toEqual([]);
	});
});
