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

export const concept2TokenDataSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	expires_in: z.number(),
	token_type: z.string(),
});
export type Concept2TokenDataInput = z.infer<typeof concept2TokenDataSchema>;

export const connectConcept2InputSchema = z.object({
	tokens: concept2TokenDataSchema,
	concept2UserId: z.number(),
});
export type ConnectConcept2Input = z.infer<typeof connectConcept2InputSchema>;
