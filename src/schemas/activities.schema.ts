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

export const updateActivitySchema = z.discriminatedUnion("type", [
	createWaterActivitySchema.extend({
		id: z.string(),
	}),
	createErgActivitySchema.extend({
		id: z.string(),
	}),
]);

export type UpdateActivity = z.infer<typeof updateActivitySchema>;
