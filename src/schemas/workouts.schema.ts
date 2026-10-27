import { z } from "zod";

export const IntensityCategories = [
	"C1",
	"C2",
	"C3",
	"C4",
	"C5",
	"C6",
] as const;

const intensityCategorySchema = z.enum(IntensityCategories);

export type IntensityCategory = z.infer<typeof intensityCategorySchema>;

export const WorkoutActivityTypes = [
	"water",
	"erg",
	"crossTrain",
	"strength",
] as const;

const activityTypeSchema = z.enum(WorkoutActivityTypes);

export type WorkoutActivityType = z.infer<typeof activityTypeSchema>;

// How a session's minutes divide across zones. Sessions without a breakdown
// (strength work, or anything not yet detailed) simply omit it.
export const zoneMinutesSchema = z.object({
	C1: z.number().nonnegative().optional(),
	C2: z.number().nonnegative().optional(),
	C3: z.number().nonnegative().optional(),
	C4: z.number().nonnegative().optional(),
	C5: z.number().nonnegative().optional(),
	C6: z.number().nonnegative().optional(),
});

export type ZoneMinutes = z.infer<typeof zoneMinutesSchema>;

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
	activityType: activityTypeSchema.default("erg"),
	elapsedTime: z.number().optional(),
	distance: z.number().optional(),
	intervalCount: z.number().default(1),
	intensityCategory: intensityCategorySchema,
	fragments: z.array(createWorkoutFragmentSchema).optional(),
	zoneMinutes: zoneMinutesSchema.optional(),
});

export type CreateWorkout = z.infer<typeof workoutCoreSchema>;

export const updateWorkoutFragmentSchema = createWorkoutFragmentSchema.extend({
	id: z.string().optional(),
	workoutId: z.string().optional(),
});

export const updateWorkoutSchema = workoutCoreSchema.extend({
	id: z.string(),
	fragments: z.array(updateWorkoutFragmentSchema).optional(),
});

export type UpdateWorkout = z.infer<typeof updateWorkoutSchema>;

export const getWorkoutByIdInputSchema = z.object({ id: z.string() });
export type GetWorkoutByIdInput = z.infer<typeof getWorkoutByIdInputSchema>;
