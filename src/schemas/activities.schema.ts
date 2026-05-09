import { z } from "zod";
import { workoutCoreSchema } from "./workouts.schema";

export const ActivityType = ["water", "erg"] as const;

const createWaterActivitySchema = z.object({
	name: z.string(),
	startDate: z.string(),
	timezone: z.string(),
	workoutType: workoutCoreSchema.shape.workoutType,
	elapsedTime: z.number(),
	distance: z.number(),
	athleteId: z.string(),
	boatId: z.string(),
	workoutId: z.string().optional(),
	type: z.literal("water"),
});

const createErgActivitySchema = z.object({
	name: z.string(),
	startDate: z.string(),
	timezone: z.string(),
	workoutType: workoutCoreSchema.shape.workoutType,
	elapsedTime: z.number(),
	distance: z.number(),
	athleteId: z.string(),
	ergId: z.string().optional(),
	workoutId: z.string().optional(),
	type: z.literal("erg"),
});

export const createActivitySchema = z.discriminatedUnion("type", [
	createWaterActivitySchema,
	createErgActivitySchema,
]);

export type CreateActivity = z.infer<typeof createActivitySchema>;

export const CourseType = ["course", "into_the_bay"] as const;

export const COURSE_LAP_METERS: Record<(typeof CourseType)[number], number> = {
	course: 2000,
	into_the_bay: 2500,
};

const COURSE_PHRASE: Record<(typeof CourseType)[number], string> = {
	course: "on the course",
	into_the_bay: "around and into the bay",
};

export function describeLaps(
	laps: number,
	courseType: (typeof CourseType)[number],
): string {
	const lapWord = laps === 1 ? "lap" : "laps";
	return `${laps} ${lapWord} ${COURSE_PHRASE[courseType]}`;
}

const createWaterActivityFormSchema = createWaterActivitySchema
	.omit({ distance: true })
	.extend({
		laps: z.number().positive(),
		courseType: z.enum(CourseType),
	});

export const createActivityFormSchema = z
	.discriminatedUnion("type", [
		createWaterActivityFormSchema,
		createErgActivitySchema,
	])
	.transform((data): CreateActivity => {
		if (data.type === "water") {
			const { laps, courseType, ...rest } = data;
			return {
				...rest,
				name: rest.name?.trim() || describeLaps(laps, courseType),
				distance: laps * COURSE_LAP_METERS[courseType],
			};
		}
		return data;
	});

export type CreateActivityFormInput = z.input<typeof createActivityFormSchema>;

export const updateActivitySchema = z.discriminatedUnion("type", [
	createWaterActivitySchema.extend({
		id: z.string(),
	}),
	createErgActivitySchema.extend({
		id: z.string(),
	}),
]);

export type UpdateActivity = z.infer<typeof updateActivitySchema>;

export const getActivitiesInputSchema = z.object({
	boatId: z.string().optional(),
	athleteId: z.string().optional(),
	ergId: z.string().optional(),
});
export type GetActivitiesInput = z.infer<typeof getActivitiesInputSchema>;

export const getActivityByIdInputSchema = z.object({
	id: z.string().optional(),
});
export type GetActivityByIdInput = z.infer<typeof getActivityByIdInputSchema>;

export const deleteActivityInputSchema = z.object({ id: z.string() });
export type DeleteActivityInput = z.infer<typeof deleteActivityInputSchema>;
