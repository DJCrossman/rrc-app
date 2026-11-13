import { ClerkAPIResponseError } from "@clerk/shared/error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrganizationMembershipList = vi.fn();
const createOrganizationMembership = vi.fn();

vi.mock("@/lib/env", () => ({
	envVars: { NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: "org_club" },
}));
vi.mock("@clerk/nextjs/server", () => ({
	clerkClient: async () => ({
		users: { getOrganizationMembershipList },
		organizations: { createOrganizationMembership },
	}),
}));

const { ensureDefaultOrganizationMembership } = await import(
	"./default-organization"
);

const notAMember = { data: [] };
const clubMember = {
	data: [{ organization: { id: "org_club" }, role: "org:member" }],
};

beforeEach(() => {
	getOrganizationMembershipList.mockReset();
	createOrganizationMembership.mockReset();
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ensureDefaultOrganizationMembership", () => {
	it("returns member without creating a membership when the user is already in the club", async () => {
		getOrganizationMembershipList.mockResolvedValue(clubMember);

		expect(await ensureDefaultOrganizationMembership("user_existing")).toBe(
			"member",
		);
		expect(createOrganizationMembership).not.toHaveBeenCalled();
	});

	it("returns member once the membership is created", async () => {
		getOrganizationMembershipList.mockResolvedValue(notAMember);
		createOrganizationMembership.mockResolvedValue({});

		expect(await ensureDefaultOrganizationMembership("user_created")).toBe(
			"member",
		);
	});

	it("returns full when the club has reached its member limit", async () => {
		getOrganizationMembershipList.mockResolvedValue(notAMember);
		createOrganizationMembership.mockRejectedValue(
			new ClerkAPIResponseError("Forbidden", {
				status: 403,
				data: [
					{
						code: "organization_membership_quota_exceeded",
						message: "Membership quota exceeded",
					},
				],
			}),
		);

		expect(await ensureDefaultOrganizationMembership("user_full")).toBe("full");
	});

	it("returns failed when the membership cannot be created for another reason", async () => {
		getOrganizationMembershipList.mockResolvedValue(notAMember);
		createOrganizationMembership.mockRejectedValue(
			new ClerkAPIResponseError("Unprocessable", {
				status: 422,
				data: [{ code: "form_param_invalid", message: "Invalid" }],
			}),
		);

		expect(await ensureDefaultOrganizationMembership("user_failed")).toBe(
			"failed",
		);
	});

	it("returns failed instead of throwing when the membership cannot be looked up again", async () => {
		getOrganizationMembershipList
			.mockResolvedValueOnce(notAMember)
			.mockRejectedValueOnce(new Error("unreachable"));
		createOrganizationMembership.mockRejectedValue(new Error("unreachable"));

		expect(await ensureDefaultOrganizationMembership("user_unconfirmed")).toBe(
			"failed",
		);
	});

	it("returns member when a concurrent request added the membership first", async () => {
		getOrganizationMembershipList
			.mockResolvedValueOnce(notAMember)
			.mockResolvedValueOnce(clubMember);
		createOrganizationMembership.mockRejectedValue(
			new ClerkAPIResponseError("Unprocessable", {
				status: 422,
				data: [{ code: "already_a_member_in_organization", message: "" }],
			}),
		);

		expect(await ensureDefaultOrganizationMembership("user_concurrent")).toBe(
			"member",
		);
	});
});
