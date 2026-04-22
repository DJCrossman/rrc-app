interface QueryOptions<T> {
	type: string;
	id?: string;
	query?: Record<string, T>;
}

export const generateQueryKey = <T>({ type, id, query }: QueryOptions<T>) => {
	return [
		type,
		id,
		...(query
			? Object.entries(query)
					.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
					.map(([key, value]) => `${key}:${value}`)
			: []),
	];
};
