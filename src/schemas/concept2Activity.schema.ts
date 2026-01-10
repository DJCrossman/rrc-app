import { z } from "zod";

export const concept2ActivitySchema = z.object({
	id: z.number(),
	user_id: z.number(),
	date: z.string(),
	timezone: z.string(),
	date_utc: z.string(),
	distance: z.number(),
	type: z.string(),
	time: z.number(),
	time_formatted: z.string(),
	workout_type: z.string(),
	source: z.string(),
	weight_class: z.string(),
	verified: z.boolean(),
	ranked: z.boolean(),
	comments: z.string().nullable(),
	privacy: z.string(),
	stroke_data: z.union([
		z.boolean(),
		z.array(
			z.object({
				t: z.number(),
				d: z.number(),
				p: z.number(),
				spm: z.number(),
			}),
		),
	]),
	rest_distance: z.number().optional(),
	rest_time: z.number().optional(),
	calories_total: z.number(),
	drag_factor: z.number().optional(),
	stroke_count: z.number(),
	stroke_rate: z.number(),
	heart_rate: z.object({
		average: z.number(),
		min: z.number().optional(),
		max: z.number().optional(),
		ending: z.number(),
		recovery: z.number().optional(),
	}),
	workout: z.object({
		intervals: z
			.array(
				z.object({
					type: z.string(),
					time: z.number(),
					distance: z.number(),
					calories_total: z.number(),
					stroke_rate: z.number(),
					rest_time: z.number().optional(),
					heart_rate: z
						.object({
							average: z.number(),
							min: z.number().optional(),
							max: z.number().optional(),
							ending: z.number(),
							recovery: z.number().optional(),
							rest: z.number().optional(),
						})
						.optional(),
				}),
			)
			.optional(),
	}),
	real_time: z.null().optional(),
});

export type Concept2Activity = z.infer<typeof concept2ActivitySchema>;
