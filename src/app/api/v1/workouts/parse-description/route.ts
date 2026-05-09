import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTextFromPrompt } from "@/lib/ai/generateText";
import { PARSE_WORKOUT_DESCRIPTION_PROMPT } from "@/lib/ai/prompts/parse-workout-description.prompt";
import { requireAuth } from "@/lib/auth";
import { parseDuration } from "@/lib/parsers/parseDuration";
import { parseIntervals } from "@/lib/parsers/parseIntervals";
import {
	type CreateWorkoutFragment,
	createWorkoutFragmentSchema,
} from "@/schemas";

export interface ParseDescriptionResult {
	workoutType: "distance" | "time" | "other";
	elapsedTime?: number;
	distance?: number;
	intervalCount: number;
	fragments?: CreateWorkoutFragment[];
}

const parsedDescriptionSchema = z.object({
	workoutType: z.enum(["distance", "time", "other"]).default("other"),
	elapsedTime: z.number().optional(),
	distance: z.number().optional(),
	intervalCount: z.number().default(1),
	fragments: z.array(createWorkoutFragmentSchema).optional(),
});

const requestSchema = z.object({
	description: z.string().min(1),
});

export async function POST(request: Request) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const parsedRequest = requestSchema.safeParse(body);
	if (!parsedRequest.success) {
		return NextResponse.json(
			{ error: "description is required" },
			{ status: 400 },
		);
	}
	const { description } = parsedRequest.data;

	let response: string;
	try {
		response = await generateTextFromPrompt({
			prompt: `${PARSE_WORKOUT_DESCRIPTION_PROMPT}\n${description}`,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return NextResponse.json(
			{ error: `AI generation failed: ${message}` },
			{ status: 502 },
		);
	}

	let jsonData = response.trim();
	const codeBlockMatch = jsonData.match(/```(?:json)?\n([\s\S]*?)\n```/);
	if (codeBlockMatch) {
		jsonData = codeBlockMatch[1];
	}

	let aiData: unknown;
	try {
		aiData = JSON.parse(jsonData);
	} catch (error) {
		return NextResponse.json(
			{ error: `Failed to parse AI JSON. ${error}\n${jsonData}` },
			{ status: 502 },
		);
	}

	const parsedAi = parsedDescriptionSchema.safeParse(aiData);
	if (!parsedAi.success) {
		return NextResponse.json(
			{
				error: `AI output did not match expected shape: ${parsedAi.error.message}`,
			},
			{ status: 502 },
		);
	}

	const ai = parsedAi.data;
	const result: ParseDescriptionResult = {
		workoutType: ai.workoutType,
		elapsedTime: ai.elapsedTime ?? parseDuration(description),
		distance: ai.distance,
		intervalCount: ai.intervalCount ?? parseIntervals(description),
		fragments: ai.fragments,
	};

	return NextResponse.json(result);
}
