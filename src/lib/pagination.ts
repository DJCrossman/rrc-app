export interface PaginatedResponse<T> {
	data: T[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export function paginate<T>({
	data,
	totalCount,
	page,
	pageSize,
}: {
	data: T[];
	totalCount: number;
	page?: number;
	pageSize?: number;
}): PaginatedResponse<T> {
	const resolvedPageSize = pageSize ?? totalCount;
	const resolvedPage = pageSize != null ? (page ?? 1) : 1;
	const totalPages =
		resolvedPageSize > 0
			? Math.max(1, Math.ceil(totalCount / resolvedPageSize))
			: 1;
	return {
		data,
		totalCount,
		page: resolvedPage,
		pageSize: resolvedPageSize,
		totalPages,
	};
}
