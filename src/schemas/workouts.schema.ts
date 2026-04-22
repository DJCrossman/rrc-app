import { z } from "zod";

const intensityCategorySchema = z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]);

export type IntensityCategory = z.infer<typeof intensityCategorySchema>;

export const createWorkoutFragmentSchema = z.object({
	rate: z.number().optional(),
	elapsedTime: z.number().optional(),
	distance: z.number().optional(),
	relativeTo: z.enum(["2K", "6K"]),
	relativeSplit: z.number(),
});

export type CreateWorkoutFragment = z.infer<typeof createWorkoutFragmentSchema>;

export const workoutCoreSchema = z.object({
	description: z.string(),
	startDate: z.string(),
	workoutType: z.enum(["distance", "time", "other"]),
	elapsedTime: z.number().optional(),
	distance: z.number().optional(),
	intervalCount: z.number().default(1),
	intensityCategory: intensityCategorySchema,
	fragments: z.array(createWorkoutFragmentSchema).optional(),
});

export type CreateWorkout = z.infer<typeof workoutCoreSchema>;
