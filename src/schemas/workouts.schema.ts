import { z } from "zod";

export const workoutCoreSchema = z.object({
	description: z.string(),
	modifiedDescription: z.string().optional(),
	startDate: z.string(),
	duration: z.number().optional(),
});

export type CreateWorkout = z.infer<typeof workoutCoreSchema>;

export const workoutSchema = workoutCoreSchema.extend({
	id: z.number(),
});

export type Workout = z.infer<typeof workoutSchema>;

export const workoutsSchema = z.array(workoutSchema);

export type Workouts = z.infer<typeof workoutsSchema>;
