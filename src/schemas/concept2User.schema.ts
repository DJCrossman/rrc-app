import { z } from "zod";

export const concept2UserSchema = z.object({
	id: z.number(),
	username: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	gender: z.string(),
	dob: z.string(),
	email: z.string(),
	country: z.string(),
	profile_image: z.string().nullable(),
	age_restricted: z.boolean(),
	email_permission: z.boolean(),
	max_heart_rate: z.null(),
	logbook_privacy: z.string(),
});

export type Concept2User = z.infer<typeof concept2UserSchema>;
