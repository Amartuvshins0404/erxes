/**
 * Anything read through apollo carries `__typename`, and every `*Input` type in
 * the gateway schema rejects it. Forms are seeded from query results, so the
 * key travels back into mutation variables unless it is stripped first.
 */
export const omitTypename = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => omitTypename(item)) as T;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([key]) => key !== '__typename',
  );

  return Object.fromEntries(
    entries.map(([key, entryValue]) => [key, omitTypename(entryValue)]),
  ) as T;
};
