import { z } from "zod";

export const concept2ResultSchema = z.object({
	type: z.string(),
	date: z.string(),
	distance: z.number(),
	time: z.number(),
	rest_distance: z.number(),
	rest_time: z.number(),
	weight_class: z.string(),
	verified: z.boolean(),
	comments: z.string(),
	stroke_rate: z.number(),
	workout_type: z.string(),
	heart_rate: z.object({ ending: z.number(), average: z.number() }),
	workout: z.object({
		intervals: z.array(
			z.union([
				z.object({
					time: z.number(),
					distance: z.number(),
					calories_total: z.number(),
					stroke_rate: z.number(),
					heart_rate: z.object({ average: z.number(), ending: z.number() }),
					type: z.string(),
				}),
				z.object({
					type: z.string(),
					time: z.number(),
					distance: z.number(),
					calories_total: z.number(),
					stroke_rate: z.number(),
					heart_rate: z.object({ average: z.number(), ending: z.number() }),
				}),
			]),
		),
	}),
	stroke_data: z.array(
		z.object({ t: z.number(), d: z.number(), p: z.number(), spm: z.number() }),
	),
});

export type Concept2Result = z.infer<typeof concept2ResultSchema>;

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

export class Concept2Error extends Error {
	auth_url?: string;
	status?: number;

	constructor(value: Partial<Concept2Error> = {}) {
		super(value.message);
		this.name = "Concept2Error";
		this.auth_url = value.auth_url;
		this.status = value.status;
	}
}
