import { z } from 'zod';

export const ProgramType = ['masters', 'juniors', 'alumni'] as const;

export const createAthleteSchema = z.object({
  name: z.string(),
  program: z.enum(ProgramType),
});

export type CreateAthlete = z.infer<typeof createAthleteSchema>;

export const athleteSchema = createAthleteSchema.extend({
  id: z.number(),
});

export type Athlete = z.infer<typeof athleteSchema>;

export const athletesSchema = z.array(athleteSchema);

export type Athletes = z.infer<typeof athletesSchema>;
