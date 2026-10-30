import React from 'react';
import { useInView } from 'react-intersection-observer';

import { Skeleton, Table } from 'erxes-ui/components';

import { useRecordTable } from './RecordTableProvider';
import { cn } from 'erxes-ui/lib';

export const RecordTableRowSkeleton = ({
  rows = 1,
  handleInView,
  backward,
  root,
}: {
  rows?: number;
  handleInView?: () => void;
  backward?: boolean;
  root?: Element | null;
}) => {
  const { table } = useRecordTable();
  const columnCount =
    table.getRowModel().rows[0]?.getVisibleCells().length ||
    table.getVisibleLeafColumns().length;
  const { ref } = useInView({
    root: root ?? null,
    onChange: (inView) => {
      inView && handleInView?.();
    },
  });

  return (
    <>
      <SkeletonRow ref={ref} columnCount={columnCount} />
      {Array.from({ length: rows - 1 }).map((_, index) => (
        <SkeletonRow
          key={index}
          columnCount={columnCount}
          className={cn(backward && index === rows - 2 && '[&>td]:border-b-0')}
        />
      ))}
    </>
  );
};

const SKELETON_WIDTHS = ['w-3/5', 'w-4/5', 'w-2/5', 'w-3/4', 'w-1/2'];

const SkeletonRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    columnCount: number;
  }
>(({ columnCount, className, ...props }, ref) => {
  return (
    <Table.Row
      ref={ref}
      className={cn(
        'h-cell hover:bg-transparent [&>td:first-child]:border-l-0',
        className,
      )}
      {...props}
    >
      {Array.from({ length: columnCount }).map((_, index) => (
        <Table.Cell
          key={index}
          className="border-r-0 border-b bg-background px-2.5 group-hover/table-row:bg-background"
        >
          <Skeleton
            className={cn(
              'h-3 min-w-3 rounded-full',
              SKELETON_WIDTHS[index % SKELETON_WIDTHS.length],
            )}
          />
        </Table.Cell>
      ))}
    </Table.Row>
  );
});
