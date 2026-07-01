import { describe, expect, it } from "vitest";
import { resolveOAuthReturnPath } from "./oauth-return";

describe("resolveOAuthReturnPath", () => {
	it("defaults to the settings page when no value is given", () => {
		expect(resolveOAuthReturnPath(undefined)).toBe("/settings/apps");
		expect(resolveOAuthReturnPath(null)).toBe("/settings/apps");
		expect(resolveOAuthReturnPath("")).toBe("/settings/apps");
	});

	it("honours allowlisted internal paths, including query strings", () => {
		expect(resolveOAuthReturnPath("/settings/apps")).toBe("/settings/apps");
		expect(resolveOAuthReturnPath("/onboarding")).toBe("/onboarding");
		expect(resolveOAuthReturnPath("/onboarding?step=strava")).toBe(
			"/onboarding?step=strava",
		);
		expect(resolveOAuthReturnPath("/onboarding/anything")).toBe(
			"/onboarding/anything",
		);
	});

	it("rejects external and protocol-relative destinations (open-redirect guard)", () => {
		expect(resolveOAuthReturnPath("https://evil.com")).toBe("/settings/apps");
		expect(resolveOAuthReturnPath("//evil.com")).toBe("/settings/apps");
		expect(resolveOAuthReturnPath("http://localhost/onboarding")).toBe(
			"/settings/apps",
		);
	});

	it("rejects non-allowlisted internal paths and prefix look-alikes", () => {
		expect(resolveOAuthReturnPath("/dashboard")).toBe("/settings/apps");
		expect(resolveOAuthReturnPath("/onboarding-evil")).toBe("/settings/apps");
		expect(resolveOAuthReturnPath("/settings/apps-evil")).toBe(
			"/settings/apps",
		);
	});
});
