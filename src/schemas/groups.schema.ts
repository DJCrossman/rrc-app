import { z } from "zod";

const groupNameSchema = z
	.string()
	.trim()
	.min(1, { message: "Name is required" });
const programIdsSchema = z
	.array(z.string())
	.transform((ids) => [...new Set(ids)]);

export const createGroupSchema = z.object({
	name: groupNameSchema,
	programIds: programIdsSchema.optional(),
});
export type CreateGroup = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
	id: z.string(),
	name: groupNameSchema.optional(),
	programIds: programIdsSchema.optional(),
});
export type UpdateGroup = z.infer<typeof updateGroupSchema>;

export const groupFormSchema = z.object({
	name: groupNameSchema,
	programIds: z.array(z.string()),
});
export type GroupFormValues = z.infer<typeof groupFormSchema>;

export const getGroupByIdInputSchema = z.object({ id: z.string() });
export type GetGroupByIdInput = z.infer<typeof getGroupByIdInputSchema>;

export const deleteGroupInputSchema = z.object({ id: z.string() });
export type DeleteGroupInput = z.infer<typeof deleteGroupInputSchema>;
