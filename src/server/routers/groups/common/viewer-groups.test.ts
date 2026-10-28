import { describe, expect, it } from "vitest";
import { canSeeGroup } from "./viewer-groups";

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
