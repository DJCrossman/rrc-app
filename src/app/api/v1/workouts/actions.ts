"use server";
import { parseImage } from "@/lib/ai/parseImage";
import { PARSE_WORKOUT_SCREENSHOT_PROMPT } from "@/lib/ai/prompts/parse-workout-screenshot.prompt";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDuration } from "@/lib/parsers/parseDuration";
import { parseIntensity } from "@/lib/parsers/parseIntensity";
import { parseIntervals } from "@/lib/parsers/parseIntervals";
import { type CreateWorkout, workoutCoreSchema } from "@/schemas";
import { mapToWorkoutDto, workoutInclude } from "./utils";

export const getWorkouts = async () => {
	await requireAuth();

	const workouts = await db.workout.findMany({
		orderBy: { startDate: "desc" },
		include: workoutInclude,
	});
	return {
		data: workouts.map(mapToWorkoutDto),
	};
};

export async function getWorkoutById(id: string) {
	await requireAuth();

	const workout = await db.workout.findUnique({
		where: { id },
		include: workoutInclude,
	});
	return workout ? mapToWorkoutDto(workout) : null;
}

export const createWorkout = async (data: CreateWorkout) => {
	await requireAuth();

	const workout = await db.workout.create({
		data: {
			description: data.description,
			startDate: new Date(data.startDate),
			workoutType: data.workoutType,
			elapsedTime: data.elapsedTime,
			distance: data.distance,
			intervalCount: data.intervalCount ?? 1,
			intensityCategory: data.intensityCategory,
			fragments: data.fragments?.length
				? { create: data.fragments }
				: undefined,
		},
		include: workoutInclude,
	});
	return mapToWorkoutDto(workout);
};

export const updateWorkout = async (data: Workout) => {
	await requireAuth();

	const workout = await db.workout.update({
		where: { id: data.id },
		data: {
			description: data.description,
			startDate: new Date(data.startDate),
			workoutType: data.workoutType,
			elapsedTime: data.elapsedTime,
			distance: data.distance,
			intervalCount: data.intervalCount ?? 1,
			intensityCategory: data.intensityCategory,
			fragments: {
				deleteMany: {},
				...(data.fragments?.length
					? {
							create: data.fragments.map(
								({ id: _id, workoutId: _wid, ...f }) => f,
							),
						}
					: {}),
			},
		},
		include: workoutInclude,
	});
	return mapToWorkoutDto(workout);
};

export interface UploadWorkoutScreenshotResult {
	workouts: PromiseSettledResult<CreateWorkout>[];
}

export const uploadWorkoutScreenshot = async (
	file: File,
): Promise<UploadWorkoutScreenshotResult> => {
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
		throw new Error(`Failed to parse JSON data.${error}\n${jsonData}`);
	}
	if (!parsedData) throw new Error(`No data parsed from image.\n${jsonData}`);
	if (typeof parsedData !== "object")
		throw new Error(`Parsed data is not a valid object.\n${jsonData}`);
	if (!("workouts" in parsedData))
		throw new Error(
			`Parsed data is not a valid object with workouts.\n${jsonData}`,
		);
	if (!Array.isArray(parsedData.workouts))
		throw new Error(`Parsed workouts is not a valid array.\n${jsonData}`);

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

	return { workouts };
};

export type Workout = NonNullable<Awaited<ReturnType<typeof getWorkoutById>>>;
export type Workouts = Awaited<ReturnType<typeof getWorkouts>>["data"];
export type WorkoutFragment = Workout["fragments"][number];
