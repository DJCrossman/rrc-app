import { DateTime } from "luxon";
import { NextResponse } from "next/server";
import { parseImage } from "@/lib/ai/parseImage";
import { PARSE_CONCEPT2_SCREENSHOT_PROMPT } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/auth";
import { createActivitySchema } from "@/schemas";

export async function POST(request: Request) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file");
		const athleteId = formData.get("athleteId");
		const ergId = formData.get("ergId");

		if (!(file instanceof File)) {
			return NextResponse.json(
				{ success: false, error: "file is required" },
				{ status: 400 },
			);
		}
		if (typeof athleteId !== "string") {
			return NextResponse.json(
				{ success: false, error: "athleteId is required" },
				{ status: 400 },
			);
		}

		const arrayBuffer = await file.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");

		const response = await parseImage({
			imageBase64: base64,
			prompt: PARSE_CONCEPT2_SCREENSHOT_PROMPT,
		});

		let jsonData = response.trim();
		const codeBlockMatch = jsonData.match(/```(?:json)?\n([\s\S]*?)\n```/);
		if (codeBlockMatch) {
			jsonData = codeBlockMatch[1];
		}

		jsonData = jsonData
			.replace(/\/\/.*$/gm, "")
			.replace(/\/\*[\s\S]*?\*\//g, "");

		let parsedData: unknown;
		try {
			parsedData = JSON.parse(jsonData);
		} catch (error) {
			console.error("Failed to parse JSON from AI response:", error);
			console.error("Raw response:", response);
			return NextResponse.json({ success: false });
		}

		if (!parsedData || typeof parsedData !== "object") {
			console.error("Invalid parsed data:", parsedData);
			return NextResponse.json({ success: false });
		}

		const activityData = {
			...parsedData,
			type: "erg",
			timezone:
				"timezone" in parsedData && typeof parsedData.timezone === "string"
					? parsedData.timezone
					: DateTime.now().zoneName,
			athleteId,
			ergId: typeof ergId === "string" && ergId.length > 0 ? ergId : undefined,
			workoutId: undefined,
		};

		const validatedActivity = createActivitySchema.parse(activityData);

		return NextResponse.json({ success: true, data: validatedActivity });
	} catch (error) {
		console.error("Error uploading activity screenshot:", error);
		if (error instanceof Error) {
			console.error("Error message:", error.message);
		}
		return NextResponse.json({ success: false });
	}
}
