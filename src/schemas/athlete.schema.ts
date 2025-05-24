import { z } from 'zod';
import { membershipSchema } from './memberships.schema';
import { baseUserSchema } from './user.schema';

export const athleteDBSchema = z.object({
  id: z.number(),
  userId: z.number(),
  membershipIds: z.array(z.number()),
});

export type AthleteDB = z.infer<typeof athleteDBSchema>;

export const ProgramTypes = ['masters', 'juniors', 'alumni'] as const;

export const createAthleteSchema = baseUserSchema.extend({
  programId: z.string().optional(),
});

export type CreateAthlete = z.infer<typeof createAthleteSchema>;

export const athleteSchema = baseUserSchema.extend({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  activeMembership: membershipSchema.optional(),
  programType: z.enum(ProgramTypes).optional(),
});

export type Athlete = z.infer<typeof athleteSchema>;

export const athletesSchema = z.array(athleteSchema);

export type Athletes = z.infer<typeof athletesSchema>;
