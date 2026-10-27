import { describe, expect, it } from "vitest";
import {
	filterMembers,
	type MemberAthlete,
	mergeMembers,
	sortMembers,
} from "./member-rows";

const athlete = (
	overrides: Partial<MemberAthlete> & { id: string },
): MemberAthlete => ({
	userId: null,
	firstName: "Ann",
	lastName: "Lee",
	nickname: null,
	name: "Ann",
	phone: "",
	email: null,
	role: "member",
	gender: "female",
	dateOfBirth: "1990-01-01T00:00:00.000Z",
	dateJoined: undefined,
	heightInCm: null,
	weightInKg: null,
	memberships: [],
	activeMembership: undefined,
	groups: [],
	...overrides,
});

const membership = (programId: string, name = programId) => ({
	id: `mem_${programId}`,
	athleteId: "ath",
	programId,
	name,
	description: null,
	startDate: "2026-01-01T00:00:00.000Z",
	endDate: "2026-12-31T00:00:00.000Z",
});

const user = (
	userId: string,
	overrides: Partial<{
		isAdmin: boolean;
		firstName: string | null;
		lastName: string | null;
		email: string | null;
	}> = {},
) => ({
	userId,
	isAdmin: false,
	firstName: null,
	lastName: null,
	email: null,
	joinedAt: "2026-10-01T00:00:00.000Z",
	...overrides,
});

const invitation = (
	id: string,
	email: string,
	role: "member" | "admin" = "member",
) => ({
	id,
	email,
	role,
	invitedAt: "2026-10-20T00:00:00.000Z",
});

describe("mergeMembers", () => {
	it("joins a user to the athlete linked by user id", () => {
		const rows = mergeMembers({
			users: [user("user_ann", { isAdmin: true, email: "ann@example.com" })],
			invitations: [],
			athletes: [
				athlete({ id: "ath_ann", userId: "user_ann", nickname: "Annie" }),
			],
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			id: "user_ann",
			athleteId: "ath_ann",
			name: "Annie Lee",
			email: "ann@example.com",
			isAdmin: true,
			account: "user",
		});
	});

	it("joins a user to an unlinked athlete with the same email", () => {
		const rows = mergeMembers({
			users: [user("user_bo", { email: "Bo@Example.com" })],
			invitations: [],
			athletes: [
				athlete({
					id: "ath_bo",
					firstName: "Bo",
					lastName: "Chen",
					email: "bo@example.com",
				}),
			],
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ athleteId: "ath_bo", name: "Bo Chen" });
	});

	it("names a user without a profile from Clerk, falling back to the email", () => {
		const rows = mergeMembers({
			users: [
				user("user_cy", { firstName: "Cy", lastName: "Dao" }),
				user("user_di", { email: "di@example.com" }),
				user("user_ed"),
			],
			invitations: [],
			athletes: [],
		});

		expect(rows.map((row) => row.name)).toEqual([
			"Cy Dao",
			"di@example.com",
			"Club member",
		]);
		expect(rows.every((row) => row.athlete === null)).toBe(true);
	});

	it("attaches a pending invitation to the athlete it was sent to", () => {
		const rows = mergeMembers({
			users: [],
			invitations: [invitation("inv_1", "ann@example.com")],
			athletes: [athlete({ id: "ath_ann", email: "ann@example.com" })],
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			id: "ath_ann",
			invitationId: "inv_1",
			account: "invited",
			invitedAt: "2026-10-20T00:00:00.000Z",
		});
	});

	it("lists an invitation on its own and skips one for an existing member", () => {
		const rows = mergeMembers({
			users: [user("user_ann", { email: "ann@example.com" })],
			invitations: [
				invitation("inv_ann", "ann@example.com"),
				invitation("inv_new", "new@example.com", "admin"),
			],
			athletes: [],
		});

		expect(rows.map((row) => row.id)).toEqual(["user_ann", "inv_new"]);
		expect(rows[1]).toMatchObject({
			name: "new@example.com",
			email: "new@example.com",
			account: "invited",
			isAdmin: true,
			athlete: null,
		});
	});

	it("keeps athletes without an account on the list", () => {
		const rows = mergeMembers({
			users: [],
			invitations: [],
			athletes: [athlete({ id: "ath_fay", firstName: "Fay", role: "admin" })],
		});

		expect(rows[0]).toMatchObject({
			id: "ath_fay",
			userId: null,
			account: "none",
			isAdmin: true,
			name: "Fay Lee",
		});
	});
});

describe("filterMembers", () => {
	const rows = mergeMembers({
		users: [
			user("user_ann", { firstName: "Ann", email: "ann@example.com" }),
			user("user_bo", { email: "bo@example.com" }),
		],
		invitations: [],
		athletes: [
			athlete({
				id: "ath_ann",
				userId: "user_ann",
				memberships: [membership("prog_masters", "Masters")],
				activeMembership: membership("prog_masters", "Masters"),
			}),
			athlete({
				id: "ath_bo",
				userId: "user_bo",
				firstName: "Bo",
				memberships: [membership("prog_juniors", "Juniors")],
			}),
		],
	});

	it("matches every search term against name and email", () => {
		expect(filterMembers(rows, { search: "ann lee" }).map((r) => r.id)).toEqual(
			["user_ann"],
		);
		expect(filterMembers(rows, { search: "example" })).toHaveLength(2);
		expect(filterMembers(rows, { search: "zzz" })).toEqual([]);
	});

	it("filters by active membership and by program", () => {
		expect(filterMembers(rows, { isActive: true }).map((r) => r.id)).toEqual([
			"user_ann",
		]);
		expect(filterMembers(rows, { isActive: false }).map((r) => r.id)).toEqual([
			"user_bo",
		]);
		expect(
			filterMembers(rows, { programIds: ["prog_juniors"] }).map((r) => r.id),
		).toEqual(["user_bo"]);
	});
});

describe("sortMembers", () => {
	const rows = mergeMembers({
		users: [],
		invitations: [],
		athletes: [
			athlete({ id: "ath_zed", firstName: "Zed", dateJoined: "2024-01-01" }),
			athlete({ id: "ath_amy", firstName: "Amy" }),
			athlete({ id: "ath_kim", firstName: "Kim", dateJoined: "2025-06-01" }),
		],
	});

	it("sorts by name in either direction", () => {
		expect(sortMembers(rows, {}).map((r) => r.id)).toEqual([
			"ath_amy",
			"ath_kim",
			"ath_zed",
		]);
		expect(sortMembers(rows, { order: "desc" }).map((r) => r.id)).toEqual([
			"ath_zed",
			"ath_kim",
			"ath_amy",
		]);
	});

	it("sorts by join date and keeps members without one last", () => {
		expect(
			sortMembers(rows, { sortBy: "dateJoined", order: "desc" }).map(
				(r) => r.id,
			),
		).toEqual(["ath_kim", "ath_zed", "ath_amy"]);
	});
});
