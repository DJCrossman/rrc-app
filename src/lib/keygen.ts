interface QueryOptions {
  type: string;
  id?: number;
  query?: Record<string, any>;
}

export const generateQueryKey = ({ type, id, query }: QueryOptions) => {
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
