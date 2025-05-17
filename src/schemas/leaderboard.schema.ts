import { z } from 'zod';
import { athleteSchema } from './athlete.schema';

export const leaderboardSchema = z.array(
  athleteSchema.extend({
    meters: z.number(),
    points: z.number(),
  }),
);

export type Leaderboard = z.infer<typeof leaderboardSchema>;
