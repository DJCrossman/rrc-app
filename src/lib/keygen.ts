interface QueryOptions<T> {
	type: string;
	id?: number;
	query?: Record<string, T>;
}

export const generateQueryKey = <T>({ type, id, query }: QueryOptions<T>) => {
	return [
		type,
		id?.toString(),
		...(query
			? Object.entries(query)
					.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
					.map(([key, value]) => `${key}:${value}`)
			: []),
	];
};
