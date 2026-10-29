import { describe, expect, it, vi } from "vitest";
import type { SubmitFeedback } from "@/schemas";
import type { UnauthenticatedContext } from "@/server/context";
import type { GitHubService } from "@/server/services/github-service";
import { submitCommand } from "./submit.command";

describe("submitCommand", () => {
	it("files an issue labelled by type, identifying the reporter by ID only", async () => {
		const { context, createIssue } = createContext();

		const issue = await submitCommand(
			feedback({ type: "idea", description: "Show splits on the erg card" }),
			context,
		);

		expect(issue).toEqual({ number: 42, url: "https://github.com/issue/42" });
		const { title, body, labels } = createIssue.mock.calls[0][0];
		expect(title).toBe("Erg card");
		expect(labels).toEqual(["enhancement"]);
		expect(body).toContain("Show splits on the erg card");
		expect(body).toContain("- **Page:** `/ergs?page=2`");
		expect(body).toContain("- **Reporter:** athlete `ath_1` · user `user_1`");
		expect(body).toContain("- **Browser:** `Safari`");
		expect(body).not.toContain("Error details");
	});

	it("attaches error details in a collapsed block", async () => {
		const { context, createIssue } = createContext();

		await submitCommand(
			feedback({
				type: "bug",
				description: "",
				error: {
					message: "Boom",
					procedure: "schedule.createEvent",
					digest: "abc123",
					stack: "at render (page.tsx:1)",
				},
			}),
			context,
		);

		const { body, labels } = createIssue.mock.calls[0][0];
		expect(labels).toEqual(["bug"]);
		expect(body).toContain("_No description._");
		expect(body).toContain(
			[
				"<details><summary>Error details</summary>",
				"",
				"```text",
				"Boom",
				"procedure: schedule.createEvent",
				"digest: abc123",
				"\nat render (page.tsx:1)",
				"```",
			].join("\n"),
		);
	});

	it("names only the user when they have no athlete profile", async () => {
		const { context, createIssue } = createContext({ athlete: null });

		await submitCommand(feedback(), context);

		expect(createIssue.mock.calls[0]?.[0].body).toContain(
			"- **Reporter:** user `user_1`",
		);
	});

	it("rejects signed-out requests", async () => {
		const { context, createIssue } = createContext({ user: null });

		await expect(submitCommand(feedback(), context)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
		expect(createIssue).not.toHaveBeenCalled();
	});

	it("rejects when no GitHub token is configured", async () => {
		const { context, createIssue } = createContext({ isConfigured: false });

		await expect(submitCommand(feedback(), context)).rejects.toMatchObject({
			code: "PRECONDITION_FAILED",
		});
		expect(createIssue).not.toHaveBeenCalled();
	});
});

function feedback(overrides: Partial<SubmitFeedback> = {}): SubmitFeedback {
	return {
		type: "bug",
		title: "Erg card",
		description: "It broke",
		pagePath: "/ergs?page=2",
		userAgent: "Safari",
		...overrides,
	};
}

function createContext({
	user = { id: "user_1", isAdmin: false },
	athlete = { id: "ath_1" } as { id: string } | null,
	isConfigured = true,
}: {
	user?: UnauthenticatedContext["user"];
	athlete?: { id: string } | null;
	isConfigured?: boolean;
} = {}) {
	const createIssue = vi.fn<GitHubService["createIssue"]>(async () => ({
		number: 42,
		url: "https://github.com/issue/42",
	}));
	const context = {
		user,
		db: { athlete: { findUnique: vi.fn(async () => athlete) } },
		services: { github: { isConfigured, createIssue } },
	} as unknown as UnauthenticatedContext;
	return { context, createIssue };
}
