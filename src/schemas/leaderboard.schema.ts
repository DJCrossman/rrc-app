import { z } from "zod";
import { athleteSchema } from "./athlete.schema";

export const leaderboardSchema = z.array(
	athleteSchema
		.omit({
			firstName: true,
			lastName: true,
			nickname: true,
			gender: true,
			phone: true,
			roles: true,
			dateOfBirth: true,
			userId: true,
			activeMembership: true,
			dateJoined: true,
		})
		.extend({
			meters: z.number(),
			points: z.number(),
		}),
);

export type Leaderboard = z.infer<typeof leaderboardSchema>;
