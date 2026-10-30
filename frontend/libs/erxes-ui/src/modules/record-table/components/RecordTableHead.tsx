import React from 'react';

import { useDndContext } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column, Header } from '@tanstack/react-table';
import { cva } from 'class-variance-authority';

import { Table } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib/utils';
import { isStructuralColumn } from 'erxes-ui/modules/record-table/utils/columnUtils';

import { useRecordTable } from './RecordTableProvider';

export const recordTableHeadVariants = cva(
  'sticky top-0 z-2 h-9 border-r border-b bg-background font-sans text-xs font-medium normal-case text-muted-foreground transition-transform whitespace-nowrap last:border-r-0 [&_svg]:flex-none',
  {
    variants: {
      isDragging: {
        true: 'z-3',
      },
      isPinned: {
        left: 'z-3',
        right: 'z-3',
      },
    },
  },
);

export const RecordTableHead = ({
  header,
  children,
  className,
  ...props
}: React.ComponentProps<'th'> & {
  header: Header<any, unknown>;
}) => {
  const { column } = header;
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: column.id,
      disabled: !!column.getIsPinned(),
    });

  return (
    <Table.Head
      ref={setNodeRef}
      className={cn(
        recordTableHeadVariants({
          isDragging,
          isPinned:
            column.getIsPinned() === 'left'
              ? 'left'
              : column.getIsPinned() === 'right'
              ? 'right'
              : null,
        }),
        className,
      )}
      style={{
        width: `var(--header-${column.id}-width)`,
        left:
          column.getIsPinned() === 'left'
            ? `${column.getStart('left')}px`
            : undefined,
      }}
      {...props}
    >
      {children}
      {!isStructuralColumn(column.id) && (
        <>
          <span
            {...attributes}
            {...listeners}
            tabIndex={-1}
            className="absolute top-0 left-0 w-full h-full focus:outline-hidden"
          />

          {isDragging && (
            <div
              className="absolute top-0 left-0 h-screen w-full bg-accent/60"
              style={{ transform: CSS.Translate.toString(transform) }}
            />
          )}

          <RecordTableHeadSize header={header} />
          <RecordTableOverLine column={column} isDragging={isDragging} />
        </>
      )}
    </Table.Head>
  );
};

const RecordTableOverLine = ({
  column,
  isDragging,
}: {
  column: Column<any, unknown>;
  isDragging: boolean;
}) => {
  const { over, active } = useDndContext();
  const { table } = useRecordTable();
  const columnsOrder = table.getState().columnOrder;

  if (over?.id === column.id && !isDragging && active?.id) {
    if (!table.getState().columnPinning?.left?.includes(over.id as string)) {
      const activeIndex = columnsOrder.indexOf(active.id as string);
      const overIndex = columnsOrder.indexOf(over.id as string);
      const isOnRight = activeIndex < overIndex;
      return (
        <div
          className={cn(
            'absolute top-0 h-screen w-0.5 rounded-full bg-primary/60',
            isOnRight ? 'right-0' : 'left-0',
          )}
        />
      );
    }
  }

  return null;
};

const RecordTableHeadSize = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<'span'> & {
    header: Header<any, unknown>;
  }
>(({ header, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'absolute right-0 bottom-0 z-10 h-full w-3 cursor-col-resize touch-none select-none after:absolute after:inset-y-2 after:right-0 after:w-0.5 after:rounded-full after:transition-colors hover:after:bg-border-strong',
        header.column.getIsResizing() &&
          'after:inset-y-1 after:bg-primary hover:after:bg-primary',
      )}
      {...props}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
    />
  );
});
