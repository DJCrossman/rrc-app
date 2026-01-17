"use server";
import { parseImage } from "@/lib/ai/parseImage";
import { PARSE_WORKOUT_SCREENSHOT_PROMPT } from "@/lib/ai/prompts/parse-workout-screenshot.prompt";
import { parseDuration } from "@/lib/parsers/parseDuration";
import { parseIntervals } from "@/lib/parsers/parseIntervals";
import {
	type CreateWorkout,
	type Workout,
	workoutCoreSchema,
	workoutSchema,
	workoutsSchema,
} from "@/schemas";
import workouts from "./workouts.json";

const workoutsParsed = workoutsSchema.parse(workouts);

export const getWorkouts = async () => {
	return {
		data: workoutsParsed,
	};
};

export async function getWorkoutById(id: number): Promise<Workout | null> {
	const workout = workoutsParsed.find((workout) => workout.id === id);
	return workout ?? null;
}

export const createWorkout = async (data: CreateWorkout): Promise<Workout> => {
	const workout = workoutSchema.parse({
		id: workoutsParsed.length + 1,
		...data,
	});
	workoutsParsed.push(workout);
	return workout;
};

export const updateWorkout = async (data: Workout): Promise<Workout> => {
	const workoutIndex = workoutsParsed.findIndex(
		(workout) => workout.id === data.id,
	);
	if (workoutIndex === -1) {
		throw new Error("Workout not found");
	}
	const updatedWorkout = workoutSchema.parse({
		...workoutsParsed[workoutIndex],
		...data,
	});
	workoutsParsed[workoutIndex] = updatedWorkout;
	return updatedWorkout;
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

	const results = await parseWorkoutJsonResponse(response);

	return { workouts: results };
};

const parseWorkoutJsonResponse = async (response: string) => {
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
	if (!parsedData) {
		throw new Error(`No data parsed from image.\n${jsonData}`);
	}
	if (typeof parsedData !== "object") {
		throw new Error(`Parsed data is not a valid object.\n${jsonData}`);
	}
	if (!("workouts" in parsedData)) {
		throw new Error(
			`Parsed data is not a valid object with workouts.\n${jsonData}`,
		);
	}
	if (!Array.isArray(parsedData.workouts)) {
		throw new Error(`Parsed workouts is not a valid array.\n${jsonData}`);
	}

	const results = await Promise.allSettled(
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
			let elaspedTime: number | undefined =
				"elaspedTime" in item && typeof item.elaspedTime === "number"
					? item.elaspedTime
					: undefined;
			if (elaspedTime === undefined) {
				elaspedTime = parseDuration(
					"description" in item && typeof item.description === "string"
						? item.description.replace(/\\n/g, "\n")
						: "",
				);
			}
			const distance: number | undefined =
				"distance" in item && typeof item.distance === "number"
					? item.distance
					: undefined;
			let intervalCount: number | undefined =
				"intervalCount" in item && typeof item.intervalCount === "number"
					? item.intervalCount
					: undefined;
			if (intervalCount === undefined) {
				intervalCount = parseIntervals(description);
			}
			return Promise.resolve(
				workoutCoreSchema.parse({
					description,
					startDate:
						"startDate" in item && typeof item.startDate === "string"
							? item.startDate
							: "",
					workoutType,
					elaspedTime,
					distance,
					intervalCount,
				}),
			);
		}),
	);
	return results;
};
