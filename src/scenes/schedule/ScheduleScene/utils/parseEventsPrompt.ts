import type { ParseEventsPromptResult } from "@/app/api/v1/events/parse-prompt/route";
import type { EventType } from "@/schemas";

export async function parseEventsPrompt(
	prompt: string,
	type: EventType,
	startDate: string,
	repeatUntil?: string,
): Promise<ParseEventsPromptResult> {
	const response = await fetch("/api/v1/events/parse-prompt", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ prompt, type, startDate, repeatUntil }),
	});
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body?.error || "Failed to parse prompt");
	}
	return (await response.json()) as ParseEventsPromptResult;
}
