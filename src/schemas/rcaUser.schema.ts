import { z } from "zod";

export const rcaLoginInputSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});
export type RcaLoginInput = z.infer<typeof rcaLoginInputSchema>;
