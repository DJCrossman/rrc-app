import { z } from 'zod';

export const ProgramType = ['masters', 'juniors', 'alumni'] as const;

export const athleteSchema = z.object({
  id: z.number(),
  name: z.string(),
  program: z.enum(ProgramType),
});

export type Athlete = z.infer<typeof athleteSchema>;

export const athletesSchema = z.array(athleteSchema);

export type Athletes = z.infer<typeof athletesSchema>;
