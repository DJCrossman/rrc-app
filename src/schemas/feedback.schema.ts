import { z } from "zod";

export const FeedbackTypes = ["bug", "idea", "question"] as const;

export type FeedbackType = (typeof FeedbackTypes)[number];

export const feedbackFormSchema = z.object({
	type: z.enum(FeedbackTypes),
	title: z.string().trim().min(1, "Add a short summary").max(120),
	description: z.string().trim().max(5000),
});

export type FeedbackForm = z.infer<typeof feedbackFormSchema>;

export const reportedErrorSchema = z.object({
	message: z.string().transform((value) => value.slice(0, 1000)),
	digest: z.string().max(100).optional(),
	procedure: z.string().max(200).optional(),
	stack: z
		.string()
		.transform((value) => value.slice(0, 8000))
		.optional(),
});

export type ReportedError = z.input<typeof reportedErrorSchema>;

export const submitFeedbackSchema = feedbackFormSchema.extend({
	pagePath: z.string().max(2048),
	userAgent: z
		.string()
		.optional()
		.transform((value) => value?.slice(0, 512)),
	error: reportedErrorSchema.optional(),
});

export type SubmitFeedback = z.infer<typeof submitFeedbackSchema>;
