import { describe, expect, it } from "vitest";
import type { ViewerContext } from "@/server/context";
import { canSeeGroup, canViewGroup, canViewGroupScope } from "./viewer-groups";

const viewer = (isAdmin: boolean) =>
	({ user: { id: "user_me", isAdmin }, athlete: null }) as ViewerContext;

describe("canSeeGroup", () => {
	it("shows members only their own groups", () => {
		const member = { isAdmin: false, groupIds: new Set(["grp_masters"]) };
		expect(canSeeGroup(member, "grp_masters")).toBe(true);
		expect(canSeeGroup(member, "grp_juniors")).toBe(false);
	});

	it("shows admins every group", () => {
		expect(canSeeGroup({ isAdmin: true }, "grp_juniors")).toBe(true);
	});
});

describe("group permissions", () => {
	it("let admins view any group", async () => {
		await expect(
			canViewGroup.check({ ctx: viewer(true), input: { id: "grp_juniors" } }),
		).resolves.toBe(true);
	});

	it("hide groups from viewers who aren't in them", async () => {
		await expect(
			canViewGroup.check({ ctx: viewer(false), input: { id: "grp_juniors" } }),
		).resolves.toBe(false);
		expect(canViewGroup.error.code).toBe("NOT_FOUND");
	});

	it("only check a scoped group when one is asked for", async () => {
		await expect(
			canViewGroupScope.check({ ctx: viewer(false), input: {} }),
		).resolves.toBe(true);
		await expect(
			canViewGroupScope.check({
				ctx: viewer(false),
				input: { groupId: "grp_juniors" },
			}),
		).resolves.toBe(false);
	});
});
