import { TRPCError } from "@trpc/server";
import type { FeedbackType, SubmitFeedback } from "@/schemas";
import type { UnauthenticatedContext } from "@/server/context";

const LABELS: Record<FeedbackType, string> = {
	bug: "bug",
	idea: "enhancement",
	question: "question",
};

export async function submitCommand(
	input: SubmitFeedback,
	{ user, db, services }: UnauthenticatedContext,
) {
	if (!user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Sign in to send feedback.",
		});
	}
	if (!services.github.isConfigured) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Feedback isn't set up on this server yet.",
		});
	}

	const athlete = await db.athlete.findUnique({
		where: { userId: user.id },
		select: { id: true },
	});

	return services.github.createIssue({
		title: input.title,
		body: buildIssueBody(input, { userId: user.id, athleteId: athlete?.id }),
		labels: [LABELS[input.type]],
	});
}

function buildIssueBody(
	{ description, pagePath, userAgent, error }: SubmitFeedback,
	{ userId, athleteId }: { userId: string; athleteId?: string },
) {
	const reporter = [
		athleteId && `athlete \`${athleteId}\``,
		`user \`${userId}\``,
	]
		.filter(Boolean)
		.join(" · ");
	const lines = [
		description || "_No description._",
		"",
		"---",
		"",
		`- **Page:** \`${pagePath}\``,
		`- **Reporter:** ${reporter}`,
	];
	if (userAgent) {
		lines.push(`- **Browser:** \`${userAgent}\``);
	}
	if (error) {
		const details = [
			error.message,
			error.procedure && `procedure: ${error.procedure}`,
			error.digest && `digest: ${error.digest}`,
			error.stack && `\n${error.stack}`,
		].filter((line): line is string => !!line);
		lines.push(
			"",
			"<details><summary>Error details</summary>",
			"",
			"```text",
			...details,
			"```",
			"",
			"</details>",
		);
	}
	lines.push("", "_Sent from the RRC app._");
	return lines.join("\n");
}
