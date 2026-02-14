import { z } from "zod";

const intensityCategorySchema = z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]);

export type IntensityCategory = z.infer<typeof intensityCategorySchema>;

export const workoutCoreSchema = z.object({
	description: z.string(),
	startDate: z.string(),
	workoutType: z.enum(["distance", "time", "other"]),
	elaspedTime: z.number().optional(),
	distance: z.number().optional(),
	intervalCount: z.number().default(1),
	intensityCategory: intensityCategorySchema,
});

export type CreateWorkout = z.infer<typeof workoutCoreSchema>;

export const workoutSchema = workoutCoreSchema.extend({
	id: z.number(),
});

export type Workout = z.infer<typeof workoutSchema>;

export const workoutsSchema = z.array(workoutSchema);

export type Workouts = z.infer<typeof workoutsSchema>;
