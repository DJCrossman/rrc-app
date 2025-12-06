import { z } from "zod";

export const createErgSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	manufacturer: z.literal("concept2"),
	firmwareVersion: z.string().optional(),
	hardwareVersion: z.string().optional(),
	serialNumber: z.string().optional(),
	dataCode: z.string().optional(),
});

export type CreateErg = z.infer<typeof createErgSchema>;

export const ergSchema = createErgSchema.extend({
	id: z.number(),
	meters: z.number(),
});

export type Erg = z.infer<typeof ergSchema>;

export const ergsSchema = z.array(ergSchema);

export type Ergs = z.infer<typeof ergsSchema>;
