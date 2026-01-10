import { z } from "zod";

export const stravaUserSchema = z.object({
	id: z.number(),
	username: z.string().nullable().optional(),
	resource_state: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	bio: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	state: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	sex: z.string().nullable().optional(),
	premium: z.boolean().optional(),
	summit: z.boolean().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	badge_type_id: z.number().optional(),
	weight: z.number().nullable().optional(),
	profile_medium: z.string(),
	profile: z.string(),
	friend: z.null().optional(),
	follower: z.null().optional(),
});

export type StravaUser = z.infer<typeof stravaUserSchema>;
