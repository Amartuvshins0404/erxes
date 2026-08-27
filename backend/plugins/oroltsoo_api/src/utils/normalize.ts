export const trim = (value?: string) => (value ?? '').trim();

export const toDate = (value?: Date | string | null) =>
  value ? new Date(value) : null;

export const clampOptional = (value: unknown, min: number, max: number) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(parsed, min), max);
};
