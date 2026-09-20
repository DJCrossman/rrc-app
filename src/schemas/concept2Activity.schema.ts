import { z } from "zod";

// `timezone`, `date_utc` and `comments` are nullable in the Logbook API. The
// remaining optional fields are the ones webhook payloads omit — webhooks send
// a trimmed result (no stroke/heart-rate/interval data) compared to the REST
// endpoints, and the same schema validates both.
export const concept2ActivitySchema = z.object({
	id: z.number(),
	user_id: z.number(),
	date: z.string(),
	timezone: z.string().nullish(),
	date_utc: z.string().nullish(),
	distance: z.number(),
	type: z.string(),
	time: z.number(),
	time_formatted: z.string(),
	workout_type: z.string(),
	source: z.string(),
	weight_class: z.string(),
	verified: z.boolean(),
	ranked: z.boolean(),
	comments: z.string().nullish(),
	privacy: z.string().nullish(),
	stroke_data: z
		.union([
			z.boolean(),
			z.array(
				z.object({
					t: z.number(),
					d: z.number(),
					p: z.number(),
					spm: z.number(),
				}),
			),
		])
		.nullish(),
	rest_distance: z.number().optional(),
	rest_time: z.number().optional(),
	calories_total: z.number().nullish(),
	drag_factor: z.number().optional(),
	stroke_count: z.number().nullish(),
	stroke_rate: z.number().nullish(),
	heart_rate: z
		.object({
			average: z.number(),
			min: z.number().optional(),
			max: z.number().optional(),
			ending: z.number(),
			recovery: z.number().optional(),
		})
		.nullish(),
	workout: z
		.object({
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
		})
		.nullish(),
});

export type Concept2Activity = z.infer<typeof concept2ActivitySchema>;

export const concept2ActivityTypes = [
	"rower",
	"skierg",
	"bike",
	"dynamic",
	"slides",
	"paddle",
	"water",
	"snow",
	"rollerski",
	"multierg",
] as const;

export const getConcept2ResultsInputSchema = z.object({
	searchParams: z.object({
		from: z.string().optional(),
		to: z.string().optional(),
		type: z.enum(concept2ActivityTypes),
	}),
});
export type GetConcept2ResultsInput = z.infer<
	typeof getConcept2ResultsInputSchema
>;
