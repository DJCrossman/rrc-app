import { z } from "zod";

export const paginationInputSchema = z.object({
	page: z.number().int().min(1).optional(),
	pageSize: z.number().int().min(1).max(200).optional(),
	order: z.enum(["asc", "desc"]).optional(),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;

export function withPagination<
	TColumns extends readonly [string, ...string[]],
>({ columns }: { columns: TColumns }) {
	return z.object({
		sortBy: z.enum(columns).optional(),
		...paginationInputSchema.shape,
	});
}
