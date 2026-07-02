import { ReactNode } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { RecordTable } from 'erxes-ui';

/**
 * Shared leading column pair for the index tables: a fixed-width row-actions
 * ("more") column followed by the selection checkbox, ahead of the page's own
 * data columns. Every index table repeated this exact 14-line tail
 * (`{ id: 'more' }`, `RecordTable.checkboxColumn as ColumnDef<T>`, ...base);
 * this collapses it while each page keeps its own MoreCell and base columns.
 *
 * The `checkboxColumn` cast mirrors the one the pages already carried — the
 * table lib types the shared column loosely.
 */
export const buildActionColumns = <T,>(
  renderMore: (row: T) => ReactNode,
  baseColumns: ColumnDef<T>[],
): ColumnDef<T>[] => [
  {
    id: 'more',
    cell: ({ row }) => renderMore(row.original),
    size: 33,
  },
  RecordTable.checkboxColumn as ColumnDef<T>,
  ...baseColumns,
];
