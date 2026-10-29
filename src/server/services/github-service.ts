import { z } from "zod";
import { envVars } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const FEEDBACK_REPO = "DJCrossman/rrc-app";

const logger = createLogger("github.service");

const createdIssueSchema = z.object({
	number: z.number(),
	html_url: z.string(),
});

export type GitHubIssue = { number: number; url: string };

export type GitHubService = {
	isConfigured: boolean;
	createIssue: (issue: {
		title: string;
		body: string;
		labels: string[];
	}) => Promise<GitHubIssue>;
};

export function createGitHubService(): GitHubService {
	const token = envVars.REGINA_ROWING_FEEDBACK_TOKEN || null;

	return {
		isConfigured: token !== null,
		createIssue: async (issue) => {
			if (!token) {
				throw new Error("GitHub feedback is not configured");
			}
			const response = await fetch(
				`https://api.github.com/repos/${FEEDBACK_REPO}/issues`,
				{
					method: "POST",
					headers: {
						Accept: "application/vnd.github+json",
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						"User-Agent": "rrc-app",
						"X-GitHub-Api-Version": "2022-11-28",
					},
					body: JSON.stringify(issue),
				},
			);
			if (!response.ok) {
				logger.error("Failed to create issue", {
					status: response.status,
					body: await response.text(),
				});
				throw new Error("Couldn't create the GitHub issue");
			}
			const created = createdIssueSchema.parse(await response.json());
			return { number: created.number, url: created.html_url };
		},
	};
}
