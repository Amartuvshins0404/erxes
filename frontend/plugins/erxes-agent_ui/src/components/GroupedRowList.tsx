import { Fragment, useState } from 'react';
import { Icon, IconCaretDownFilled } from '@tabler/icons-react';
import { flexRender } from '@tanstack/react-table';
import { Badge, cn, RecordTable, Table } from 'erxes-ui';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

export interface GroupSection {
  /** Bucket key — matched against the value returned by `getKey`. */
  key: string;
  label: string;
  icon?: Icon;
  variant?: BadgeVariant;
}

export interface GroupByConfig<T> {
  /** Maps a row to the section key it belongs to. */
  getKey: (row: T) => string;
  /** Sections render in this order; empty ones are skipped. */
  sections: GroupSection[];
  /**
   * When set, the whole data row becomes clickable and invokes this with the
   * row's original. Clicks that originate inside an interactive control
   * (checkbox, link, button, input) are ignored so per-cell affordances —
   * selection, chip deep-links — keep working independently.
   */
  onRowClick?: (row: T) => void;
}

/**
 * Drop-in replacement for `RecordTable.RowList` that renders rows bucketed into
 * collapsible sections. Sections render in `groupBy.sections` order; unknown keys
 * fall to the end; empty sections are skipped.
 *
 * Collapse is local state with conditional row rendering — NOT a Radix
 * Collapsible — because `Collapsible.Content` is a <div> and cannot legally wrap
 * <tr>s inside a <tbody>. The section header is a single full-width cell built
 * from the bare `Table.*` primitives (RecordTableCell requires a TanStack cell),
 * while data rows reuse `RecordTable.Row`/`RecordTable.Cell` exactly as the stock
 * RowList does (so in-view virtualization and selection styling carry over).
 *
 * Operates on whatever rows the table currently holds (already sorted, already
 * paginated). The cursor fetch sentinels live in ResourceIndexLayout, below this
 * list, so infinite scroll is unaffected.
 */
export const GroupedRowList = <T,>({
  groupBy,
}: {
  groupBy: GroupByConfig<T>;
}) => {
  const { table } = RecordTable.useRecordTable();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const colSpan = table.getVisibleLeafColumns().length;
  const rows = table.getRowModel().rows;

  const buckets = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = groupBy.getKey(row.original as T);
    const existing = buckets.get(key);
    if (existing) existing.push(row);
    else buckets.set(key, [row]);
  }

  const orderedKeys = [
    ...groupBy.sections.flatMap((s) => (buckets.has(s.key) ? [s.key] : [])),
    ...[...buckets.keys()].filter(
      (k) => !groupBy.sections.some((s) => s.key === k),
    ),
  ];

  return (
    <>
      {orderedKeys.map((key) => {
        const meta = groupBy.sections.find((s) => s.key === key) ?? {
          key,
          label: key,
          variant: 'secondary' as BadgeVariant,
        };
        const sectionRows = buckets.get(key) ?? [];
        const isCollapsed = !!collapsed[key];
        const SectionIcon = meta.icon;

        return (
          <Fragment key={key}>
            <Table.Row className="hover:bg-muted/60">
              <Table.Cell colSpan={colSpan} className="bg-muted/40 p-0">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className="flex items-center gap-2 w-full h-9 px-3 cursor-pointer select-none"
                >
                  <IconCaretDownFilled
                    className={cn(
                      'size-3 text-muted-foreground transition-transform duration-100',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  {SectionIcon && (
                    <SectionIcon className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-xs uppercase tracking-wide">
                    {meta.label}
                  </span>
                  <Badge variant={meta.variant} className="ml-0.5">
                    {sectionRows.length}
                  </Badge>
                </button>
              </Table.Cell>
            </Table.Row>

            {!isCollapsed &&
              sectionRows.map((row) => (
                <RecordTable.Row
                  key={row.id}
                  original={row.original}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(groupBy.onRowClick && 'cursor-pointer')}
                  onClick={
                    groupBy.onRowClick
                      ? (e) => {
                          // Ignore clicks on in-row controls (checkbox toggles,
                          // chip deep-links) so they act independently.
                          if (
                            (e.target as HTMLElement).closest(
                              'a, button, input, label, [role="checkbox"]',
                            )
                          )
                            return;
                          groupBy.onRowClick?.(row.original as T);
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <RecordTable.Cell cell={cell} key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </RecordTable.Cell>
                  ))}
                </RecordTable.Row>
              ))}
          </Fragment>
        );
      })}
    </>
  );
};
