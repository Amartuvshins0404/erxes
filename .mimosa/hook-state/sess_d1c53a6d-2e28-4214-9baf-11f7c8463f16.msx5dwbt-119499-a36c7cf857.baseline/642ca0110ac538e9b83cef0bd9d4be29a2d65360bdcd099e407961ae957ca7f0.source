/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  RecordTable,
  TextOverflowTooltip,
  RecordTableInlineCell,
  Button,
} from 'erxes-ui';
import { ICVRiskGroup } from '../riskGroupTypes';
import { IconCalendar, IconLabelFilled, IconUser } from '@tabler/icons-react';
import { useQueryState } from 'erxes-ui';
import { format } from 'date-fns';
import { ClientsInline } from '~/modules/clients/components';

export const riskGroupsColumns: ColumnDef<ICVRiskGroup>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <RecordTable.InlineHead label="Name" icon={IconLabelFilled} />
    ),
    cell: ({ cell, row }) => {
      const [, setActiveRiskGroupId] =
        useQueryState<string>('activeRiskGroupId');
      return (
        <RecordTableInlineCell
          onClick={() => setActiveRiskGroupId(row.original._id)}
          asChild
        >
          <Button variant="ghost" className="">
            <TextOverflowTooltip value={cell.getValue() as string} />
          </Button>
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'client',
    accessorKey: 'client',
    header: () => <RecordTable.InlineHead label="Client" icon={IconUser} />,
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <ClientsInline clientIds={[cell.getValue() as string]} />
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'effective_date',
    accessorKey: 'effective_date',
    header: () => (
      <RecordTable.InlineHead label="Effective Date" icon={IconCalendar} />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue() as string;
      return (
        <RecordTableInlineCell>
          {date ? format(new Date(date), 'dd.MM.yyyy') : ''}
        </RecordTableInlineCell>
      );
    },
    size: 150,
  },
  {
    id: 'expiration_date',
    accessorKey: 'expiration_date',
    header: () => (
      <RecordTable.InlineHead label="Expiration Date" icon={IconCalendar} />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue() as string;
      return (
        <RecordTableInlineCell>
          {date ? format(new Date(date), 'dd.MM.yyyy') : ''}
        </RecordTableInlineCell>
      );
    },
    size: 150,
  },
];
