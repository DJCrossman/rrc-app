import type { ParseDescriptionResult } from "@/app/api/v1/workouts/parse-description/route";

export async function parseWorkoutDescription(
	description: string,
): Promise<ParseDescriptionResult> {
	const response = await fetch("/api/v1/workouts/parse-description", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ description }),
	});
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body?.error || "Failed to parse description");
	}
	return (await response.json()) as ParseDescriptionResult;
}
