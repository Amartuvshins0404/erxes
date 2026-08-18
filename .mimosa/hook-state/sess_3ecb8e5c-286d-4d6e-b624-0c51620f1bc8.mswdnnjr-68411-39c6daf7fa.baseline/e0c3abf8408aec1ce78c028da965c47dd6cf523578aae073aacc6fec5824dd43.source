export const stripTypename = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripTypename(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== '__typename')
        .map(([key, item]) => [key, stripTypename(item)]),
    ) as T;
  }

  return value;
};
