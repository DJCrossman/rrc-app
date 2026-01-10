import { z } from "zod";
import { athleteSchema } from "./athlete.schema";
import { boatSchema } from "./boat.schema";
import { concept2ActivitySchema } from "./concept2Activity.schema";
import { ergSchema } from "./erg.schema.";
import { stravaActivitySchema } from "./stravaActivity.schema";
import { workoutSchema } from "./workouts.schema";

const activityCoreSchema = z.object({
	id: z.number(),
	name: z.string(),
	startDate: z.string(),
	timezone: z.string(),
	elaspedTime: z.number(),
	distance: z.number(),
});

// Database schema with discriminated union for boat vs erg activities
const waterActivityDBSchema = activityCoreSchema.extend({
	athleteId: z.number(),
	boatId: z.number(),
	workoutId: z.number().nullable(),
	stravaId: z.number().nullable(),
	stravaData: stravaActivitySchema.nullable(),
	type: z.literal("water"),
});

const ergActivityDBSchema = activityCoreSchema.extend({
	athleteId: z.number(),
	ergId: z.number(),
	workoutId: z.number().nullable(),
	stravaId: z.number().nullable(),
	stravaData: stravaActivitySchema.nullable(),
	conceptTwoId: z.number().nullable(),
	conceptTwoData: concept2ActivitySchema.nullable(),
	type: z.literal("erg"),
});

export const activityDBSchema = z.discriminatedUnion("type", [
	waterActivityDBSchema,
	ergActivityDBSchema,
]);

export type ActivityDB = z.infer<typeof activityDBSchema>;

export const activitiesDBSchema = z.array(activityDBSchema);

export type ActivitiesDB = z.infer<typeof activitiesDBSchema>;

export const ActivityType = ["water", "erg"] as const;

// Public schema with discriminated union for boat vs erg activities
const waterActivitySchema = activityCoreSchema.extend({
	athlete: athleteSchema,
	boat: boatSchema,
	erg: z.null(),
	workout: workoutSchema.nullable(),
	isStrava: z.boolean(),
	type: z.literal("water"),
});

const ergActivitySchema = activityCoreSchema.extend({
	athlete: athleteSchema,
	boat: z.null(),
	erg: ergSchema,
	workout: workoutSchema.nullable(),
	isStrava: z.boolean(),
	type: z.literal("erg"),
});

export const activitySchema = z.discriminatedUnion("type", [
	waterActivitySchema,
	ergActivitySchema,
]);

export type Activity = z.infer<typeof activitySchema>;

export const activitiesSchema = z.array(activitySchema);
export type Activities = z.infer<typeof activitiesSchema>;
