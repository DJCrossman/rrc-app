import { NextResponse } from "next/server";
import { parseImage } from "@/lib/ai/parseImage";
import { PARSE_WORKOUT_SCREENSHOT_PROMPT } from "@/lib/ai/prompts/parse-workout-screenshot.prompt";
import { requireAuth } from "@/lib/auth";
import { parseDuration } from "@/lib/parsers/parseDuration";
import { parseIntensity } from "@/lib/parsers/parseIntensity";
import { parseIntervals } from "@/lib/parsers/parseIntervals";
import { type CreateWorkout, workoutCoreSchema } from "@/schemas";

export async function POST(request: Request) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return NextResponse.json({ error: "file is required" }, { status: 400 });
	}

	const arrayBuffer = await file.arrayBuffer();
	const base64 = Buffer.from(arrayBuffer).toString("base64");

	const response = await parseImage({
		imageBase64: base64,
		prompt: PARSE_WORKOUT_SCREENSHOT_PROMPT,
	});

	let jsonData = response.trim();
	const codeBlockMatch = jsonData.match(/```(?:json)?\n([\s\S]*?)\n```/);
	if (codeBlockMatch) {
		jsonData = codeBlockMatch[1];
	}

	let parsedData: unknown;
	try {
		parsedData = JSON.parse(jsonData);
	} catch (error) {
		return NextResponse.json(
			{ error: `Failed to parse JSON data.${error}\n${jsonData}` },
			{ status: 400 },
		);
	}
	if (!parsedData) {
		return NextResponse.json(
			{ error: `No data parsed from image.\n${jsonData}` },
			{ status: 400 },
		);
	}
	if (typeof parsedData !== "object") {
		return NextResponse.json(
			{ error: `Parsed data is not a valid object.\n${jsonData}` },
			{ status: 400 },
		);
	}
	if (!("workouts" in parsedData)) {
		return NextResponse.json(
			{
				error: `Parsed data is not a valid object with workouts.\n${jsonData}`,
			},
			{ status: 400 },
		);
	}
	if (!Array.isArray(parsedData.workouts)) {
		return NextResponse.json(
			{ error: `Parsed workouts is not a valid array.\n${jsonData}` },
			{ status: 400 },
		);
	}

	const workouts = await Promise.allSettled(
		parsedData.workouts.map(async (item: unknown) => {
			if (typeof item !== "object" || item === null) {
				return Promise.reject(new Error("Invalid workout item format"));
			}
			const description =
				"description" in item && typeof item.description === "string"
					? item.description.replace(/\\n/g, "\n")
					: "";
			const workoutType: string =
				"workoutType" in item && typeof item.workoutType === "string"
					? item.workoutType
					: "other";
			const elapsedTime: number | undefined =
				"elapsedTime" in item && typeof item.elapsedTime === "number"
					? item.elapsedTime
					: parseDuration(description);
			const distance: number | undefined =
				"distance" in item && typeof item.distance === "number"
					? item.distance
					: undefined;
			let intervalCount: number | undefined =
				"intervalCount" in item && typeof item.intervalCount === "number"
					? item.intervalCount
					: undefined;
			if (intervalCount === undefined)
				intervalCount = parseIntervals(description);
			let intensityCategory: string | undefined =
				"intensityCategory" in item &&
				typeof item.intensityCategory === "string"
					? item.intensityCategory
					: undefined;
			if (intensityCategory === undefined)
				intensityCategory = parseIntensity(description);
			const fragments =
				"fragments" in item && Array.isArray(item.fragments)
					? item.fragments
					: undefined;
			return workoutCoreSchema.parse({
				description,
				startDate:
					"startDate" in item && typeof item.startDate === "string"
						? item.startDate
						: "",
				workoutType,
				elapsedTime,
				distance,
				intervalCount,
				intensityCategory,
				fragments,
			});
		}),
	);

	const serializable: UploadWorkoutScreenshotResult = {
		workouts: workouts.map((w) =>
			w.status === "fulfilled"
				? w
				: {
						status: "rejected",
						reason: {
							message:
								w.reason instanceof Error ? w.reason.message : String(w.reason),
						} as unknown as Error,
					},
		),
	};
	return NextResponse.json(serializable);
}
export interface UploadWorkoutScreenshotResult {
	workouts: PromiseSettledResult<CreateWorkout>[];
}
