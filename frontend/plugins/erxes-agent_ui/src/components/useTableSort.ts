import { useCallback, useMemo, useState } from 'react';

export type SortState = { id: string; desc: boolean } | null;

export type SortValue = string | number | boolean | null | undefined;

const isBlank = (v: SortValue) => v === null || v === undefined || v === '';

/** Compare two present (non-blank) values; numeric-aware string fallback. */
const compareValues = (a: SortValue, b: SortValue): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean')
    return a === b ? 0 : a ? -1 : 1;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

/**
 * Controlled, client-side list sort. erxes-ui's RecordTable provider wires the
 * `sorting` state but not `getSortedRowModel`, so we sort the data array here and
 * hand the already-ordered list to the table — leaving theming and the scroll /
 * cursor machinery untouched. `getValue(row, columnId)` resolves the comparable
 * for a column, so computed columns (e.g. step count from a definition) sort too.
 *
 * Tri-state per column: unsorted → ascending → descending → unsorted. Blank
 * values always sink to the bottom regardless of direction, and ties keep their
 * original order (stable).
 */
export const useTableSort = <T,>(
  rows: T[],
  getValue: (row: T, columnId: string) => SortValue,
  initial: SortState = null,
) => {
  const [sort, setSort] = useState<SortState>(initial);

  const toggle = useCallback((id: string) => {
    setSort((prev) => {
      if (prev?.id !== id) return { id, desc: false };
      if (!prev.desc) return { id, desc: true };
      return null;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const dir = sort.desc ? -1 : 1;
    return rows
      .map((row, index) => ({ row, index, value: getValue(row, sort.id) }))
      .sort((a, b) => {
        const aBlank = isBlank(a.value);
        const bBlank = isBlank(b.value);
        if (aBlank && bBlank) return a.index - b.index;
        if (aBlank) return 1;
        if (bBlank) return -1;
        return compareValues(a.value, b.value) * dir || a.index - b.index;
      })
      .map((decorated) => decorated.row);
  }, [rows, sort, getValue]);

  return { sort, toggle, sorted };
};
