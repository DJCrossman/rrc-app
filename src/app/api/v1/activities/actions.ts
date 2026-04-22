"use server";
import { DateTime } from "luxon";
import { parseImage } from "@/lib/ai/parseImage";
import { PARSE_CONCEPT2_SCREENSHOT_PROMPT } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	type CreateActivity,
	createActivitySchema,
	type UpdateActivity,
} from "@/schemas";
import { activityInclude, mapToActivityDto } from "./utils";

export const getActivities = async ({
	boatId,
	athleteId,
	ergId,
}: {
	boatId?: string;
	athleteId?: string;
	ergId?: string;
}) => {
	await requireAuth();

	const rows = await db.activity.findMany({
		where: {
			...(boatId ? { boatId, type: "water" } : {}),
			...(athleteId ? { athleteId } : {}),
			...(ergId ? { ergId, type: "erg" } : {}),
		},
		include: activityInclude,
		orderBy: { startDate: "desc" },
	});

	return { data: rows.map(mapToActivityDto) };
};

export async function getActivityById(id?: string) {
	await requireAuth();

	if (!id) return null;

	const row = await db.activity.findUnique({
		where: { id },
		include: activityInclude,
	});
	return row ? mapToActivityDto(row) : null;
}

export const createActivity = async (data: CreateActivity) => {
	await requireAuth();

	const row = await db.activity.create({
		data: {
			name: data.name,
			startDate: new Date(data.startDate),
			timezone: data.timezone,
			workoutType: data.workoutType,
			elapsedTime: data.elapsedTime,
			distance: data.distance,
			athleteId: data.athleteId,
			workoutId: data.workoutId ?? null,
			type: data.type,
			...(data.type === "water"
				? { boatId: data.boatId }
				: { ergId: data.ergId }),
		},
		include: activityInclude,
	});

	return mapToActivityDto(row);
};

export const updateActivity = async (data: UpdateActivity) => {
	await requireAuth();

	const row = await db.activity.update({
		where: { id: data.id },
		data: {
			name: data.name,
			startDate: new Date(data.startDate),
			timezone: data.timezone,
			workoutType: data.workoutType,
			elapsedTime: data.elapsedTime,
			distance: data.distance,
			athleteId: data.athleteId,
			workoutId: data.workoutId ?? null,
			type: data.type,
			...(data.type === "water"
				? { boatId: data.boatId, ergId: null }
				: { ergId: data.ergId, boatId: null }),
		},
		include: activityInclude,
	});

	return mapToActivityDto(row);
};

export const deleteActivity = async (id: string) => {
	await requireAuth();
	await db.activity.delete({ where: { id } });
};

export const uploadErgActivityScreenshot = async ({
	file,
	athleteId,
	ergId,
}: {
	file: File;
	athleteId: string;
	ergId?: string;
}): Promise<{ success: boolean; data?: CreateActivity }> => {
	try {
		// Convert file to base64
		const arrayBuffer = await file.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");

		// Parse image with AI
		const response = await parseImage({
			imageBase64: base64,
			prompt: PARSE_CONCEPT2_SCREENSHOT_PROMPT,
		});

		// Parse JSON response
		let jsonData = response.trim();
		const codeBlockMatch = jsonData.match(/```(?:json)?\n([\s\S]*?)\n```/);
		if (codeBlockMatch) {
			jsonData = codeBlockMatch[1];
		}

		// Strip inline and block comments that break JSON.parse
		jsonData = jsonData
			.replace(/\/\/.*$/gm, "")
			.replace(/\/\*[\s\S]*?\*\//g, "");

		let parsedData: unknown;
		try {
			parsedData = JSON.parse(jsonData);
		} catch (error) {
			console.error("Failed to parse JSON from AI response:", error);
			console.error("Raw response:", response);
			return { success: false };
		}

		if (!parsedData || typeof parsedData !== "object") {
			console.error("Invalid parsed data:", parsedData);
			return { success: false };
		}

		const activityData = {
			...parsedData,
			type: "erg",
			timezone:
				"timezone" in parsedData && typeof parsedData.timezone === "string"
					? parsedData.timezone
					: DateTime.now().zoneName,
			athleteId,
			ergId: ergId || undefined,
			workoutId: undefined,
		};

		// Validate with schema
		const validatedActivity = createActivitySchema.parse(activityData);

		return { success: true, data: validatedActivity };
	} catch (error) {
		console.error("Error uploading activity screenshot:", error);
		if (error instanceof Error) {
			console.error("Error message:", error.message);
		}
		return { success: false };
	}
};

export type Activity = NonNullable<Awaited<ReturnType<typeof getActivityById>>>;
export type Activities = Awaited<ReturnType<typeof getActivities>>["data"];
