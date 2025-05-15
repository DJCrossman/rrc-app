import { z } from 'zod';

export const leaderboardSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    program: z.enum(['masters', 'juniors']),
    meters: z.number(),
    points: z.number(),
  }),
);

export type Leaderboard = z.infer<typeof leaderboardSchema>;
