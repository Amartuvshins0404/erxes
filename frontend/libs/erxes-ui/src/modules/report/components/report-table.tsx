import * as React from 'react';

import { Table } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib/utils';

function ReportTableRoot({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'table'>) {
  return (
    <Table
      data-slot="table"
      className={cn(
        'table-auto border-collapse overflow-hidden bg-transparent text-[1em]',
        className,
      )}
      {...props}
    />
  );
}

function ReportTableHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'thead'>) {
  return (
    <Table.Header
      data-slot="table-header"
      className={cn('bg-muted/50', className)}
      {...props}
    />
  );
}

function ReportTableBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'tbody'>) {
  return (
    <Table.Body
      data-slot="table-body"
      className={cn('border-0 rounded-none', className)}
      {...props}
    />
  );
}

function ReportTableFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'tfoot'>) {
  return (
    <Table.Footer
      data-slot="table-footer"
      className={cn('bg-muted/50 font-medium', className)}
      {...props}
    />
  );
}

function ReportTableRow({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'tr'>) {
  return (
    <Table.Row
      data-slot="table-row"
      className={cn(
        '[&>td]:border-b-0 [&>td:first-child]:border-l-0 hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

function ReportTableHead({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'th'>) {
  return (
    <Table.Head
      data-slot="table-head"
      className={cn(
        'h-[2.5em] border border-border bg-transparent px-[0.5em] font-sans text-[1em] font-medium normal-case text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function ReportTableCell({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'td'>) {
  return (
    <Table.Cell
      data-slot="table-cell"
      className={cn(
        'h-auto border border-border bg-transparent p-[0.3em] text-[1em] whitespace-normal break-all group-hover/table-row:bg-transparent',
        className,
      )}
      {...props}
    />
  );
}

function ReportTableCaption({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'caption'>) {
  return (
    <Table.Caption
      data-slot="table-caption"
      className={cn('mt-[1em] text-[1em]', className)}
      {...props}
    />
  );
}

export const ReportTable = Object.assign(ReportTableRoot, {
  Header: ReportTableHeader,
  Body: ReportTableBody,
  Footer: ReportTableFooter,
  Head: ReportTableHead,
  Row: ReportTableRow,
  Cell: ReportTableCell,
  Caption: ReportTableCaption,
});
