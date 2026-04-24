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

export const updateErgSchema = createErgSchema.extend({
	id: z.string(),
});

export type UpdateErg = z.infer<typeof updateErgSchema>;

export const getErgByIdInputSchema = z.object({ id: z.string() });
export type GetErgByIdInput = z.infer<typeof getErgByIdInputSchema>;

export const deleteErgInputSchema = z.object({ id: z.string() });
export type DeleteErgInput = z.infer<typeof deleteErgInputSchema>;
