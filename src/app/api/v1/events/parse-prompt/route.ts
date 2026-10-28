import { DateTime } from "luxon";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTextFromPrompt } from "@/lib/ai/generateText";
import { PARSE_EVENTS_PROMPT } from "@/lib/ai/prompts/parse-events-prompt.prompt";
import { requireAuth } from "@/lib/auth";
import {
	findPromptRange,
	isRepeatPrompt,
	resolvePromptDays,
	resolvePromptUntil,
} from "@/lib/schedule/resolvePromptDays";
import {
	EventTypes,
	IntensityCategories,
	MAX_CREATE_EVENTS,
	WorkoutActivityTypes,
} from "@/schemas";

const timeSchema = z
	.string()
	.regex(/^([01]?\d|2[0-3]):[0-5]\d$/)
	.transform((time) => time.padStart(5, "0"));

const aiEventSchema = z.object({
	type: z.enum(EventTypes).catch("training"),
	title: z.string().trim().min(1),
	days: z.array(z.string()).min(1),
	until: z.string().optional().catch(undefined),
	weeks: z.number().int().positive().optional().catch(undefined),
	allDay: z.boolean().catch(false),
	startTime: timeSchema.optional().catch(undefined),
	endTime: timeSchema.optional().catch(undefined),
	location: z.string().optional().catch(undefined),
	volunteerSpots: z.number().int().positive().optional().catch(undefined),
	workout: z
		.object({
			description: z.string().trim().min(1),
			activityType: z.enum(WorkoutActivityTypes).catch("erg"),
			intensityCategory: z.enum(IntensityCategories).catch("C6"),
		})
		.optional()
		.catch(undefined),
});

export type ParsedPromptEvent = Omit<
	z.infer<typeof aiEventSchema>,
	"days" | "until" | "weeks"
> & {
	date: string;
};

export interface ParseEventsPromptResult {
	events: ParsedPromptEvent[];
}

const requestSchema = z.object({
	prompt: z.string().trim().min(1),
	type: z.enum(EventTypes),
	startDate: z.iso.date(),
	repeatUntil: z.iso.date().optional(),
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
			{ error: "prompt, type and startDate are required" },
			{ status: 400 },
		);
	}
	const { prompt, type, startDate } = parsedRequest.data;
	const promptRange = findPromptRange(prompt, startDate);
	// Repeating everything, dated events included, is either picked in the
	// form or asked for in the prompt ("repeat every week until…").
	const repeatUntil = parsedRequest.data.repeatUntil
		? resolvePromptUntil({ until: parsedRequest.data.repeatUntil }, startDate)
		: isRepeatPrompt(prompt)
			? promptRange
			: undefined;

	let response: string;
	try {
		response = await generateTextFromPrompt({
			prompt: `${PARSE_EVENTS_PROMPT}\nSTART DATE: ${startDate} (${DateTime.fromISO(startDate).toFormat("cccc")})\nTYPE: every event is "${type}".\n\nREQUEST:\n${prompt}`,
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

	const items = Array.isArray(aiData) ? aiData : [aiData];
	const events = items.flatMap((item): ParsedPromptEvent[] => {
		const parsed = aiEventSchema.safeParse(item);
		if (!parsed.success) return [];
		const { days, until, weeks, workout, ...event } = parsed.data;
		// Small models pad sessions with workouts borrowed from the prompt's
		// examples, so a workout must be one the coach actually wrote.
		const isWritten =
			workout && normalize(prompt).includes(normalize(workout.description));
		return resolvePromptDays(
			days,
			startDate,
			repeatUntil ??
				resolvePromptUntil({ until, weeks }, startDate) ??
				promptRange,
			{ repeatDates: !!repeatUntil },
		).map((date) => ({
			...event,
			type,
			...(isWritten && { workout }),
			date,
		}));
	});
	if (events.length === 0) {
		return NextResponse.json(
			{ error: "No events could be read from that prompt" },
			{ status: 422 },
		);
	}

	if (events.length > MAX_CREATE_EVENTS) {
		return NextResponse.json(
			{
				error: `That makes ${events.length} events, more than the ${MAX_CREATE_EVENTS} that can be created at once. Try a shorter date range.`,
			},
			{ status: 422 },
		);
	}

	const result: ParseEventsPromptResult = { events };
	return NextResponse.json(result);
}

function normalize(text: string) {
	return text.toLowerCase().replace(/[′’]/g, "'").replace(/\s+/g, " ").trim();
}
