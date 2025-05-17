import { z } from 'zod';
import { athleteSchema } from './athlete.schema';
import { boatSchema } from './boat.schema';

const activityCoreSchema = z.object({
  id: z.number(),
  name: z.string(),
  startDate: z.string(),
  timezone: z.string(),
  elaspedTime: z.number(),
  distance: z.number(),
});

const activityDBSchema = activityCoreSchema.extend({
  athleteId: z.number(),
  boatId: z.number().nullable(),
  workoutId: z.number().nullable(),
  stravaId: z.number().nullable(),
});

export type ActivitaDB = z.infer<typeof activityDBSchema>;

export const activitiesDBSchema = z.array(activityDBSchema);

export type ActivitiesDB = z.infer<typeof activitiesDBSchema>;

export const ActivityType = ['water', 'erg'] as const;

export const activitySchema = activityCoreSchema.extend({
  athlete: athleteSchema,
  boat: boatSchema.nullable(),
  workout: z.object({}).nullable(),
  isStrava: z.boolean(),
  type: z.enum(ActivityType),
});

export type Activity = z.infer<typeof activitySchema>;

export const activitiesSchema = z.array(activitySchema);
export type Activities = z.infer<typeof activitiesSchema>;
