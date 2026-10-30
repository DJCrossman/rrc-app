import { z } from "zod";

export const concept2UserSchema = z.object({
	id: z.number(),
	username: z.string().nullish(),
	first_name: z.string().nullish(),
	last_name: z.string().nullish(),
	gender: z.string().nullish(),
	dob: z.string().nullish(),
	email: z.string().nullish(),
	country: z.string().nullish(),
	profile_image: z.string().nullish(),
	age_restricted: z.boolean().nullish(),
	email_permission: z.boolean().nullish(),
	max_heart_rate: z.number().nullish(),
	logbook_privacy: z.string().nullish(),
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
