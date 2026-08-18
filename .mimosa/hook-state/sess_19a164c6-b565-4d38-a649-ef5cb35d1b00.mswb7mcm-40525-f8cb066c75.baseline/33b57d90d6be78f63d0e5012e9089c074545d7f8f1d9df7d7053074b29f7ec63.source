/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  RecordTable,
  TextOverflowTooltip,
  RecordTableInlineCell,
  Badge,
  useQueryState,
  Button,
} from 'erxes-ui';
import { ICVClient } from '../clientsTypes';
import {
  IconBuilding,
  IconCategory,
  IconCategoryPlus,
  IconLabelFilled,
  IconNumber,
  IconShield,
  IconTriangle,
  IconUser,
} from '@tabler/icons-react';
import {
  CLIENT_BUSINESS_MAIN_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
} from '../constants/clientTypes';
import { ClientStatus } from './ClientStatus';
import { MembersInline } from 'ui-modules';

export const clientsColumns: ColumnDef<ICVClient>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <RecordTable.InlineHead label="Name" icon={IconLabelFilled} />
    ),
    cell: ({ cell, row }) => {
      const [, setActiveClientId] = useQueryState<string>('activeClientId');
      return (
        <RecordTableInlineCell
          onClick={() => setActiveClientId(row.original._id)}
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
    id: 'client_type',
    accessorKey: 'client_type',
    header: () => (
      <RecordTable.InlineHead label="Client type" icon={IconCategoryPlus} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          {
            CLIENT_TYPE_OPTIONS.find((type) => type.value === cell.getValue())
              ?.label
          }
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'registration_number',
    accessorKey: 'registration_number',
    header: () => (
      <RecordTable.InlineHead label="Registration number" icon={IconNumber} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <TextOverflowTooltip value={cell.getValue() as string} />
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'business_type',
    accessorKey: 'business_type',
    header: () => (
      <RecordTable.InlineHead label="Business type" icon={IconBuilding} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <TextOverflowTooltip
            value={
              CLIENT_BUSINESS_MAIN_TYPE_OPTIONS.find(
                (type) => type.value === cell.getValue(),
              )?.label
            }
          />
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'business_category',
    accessorKey: 'business_category',
    header: () => (
      <RecordTable.InlineHead label="Business category" icon={IconCategory} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <TextOverflowTooltip value={cell.getValue() as string} />
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => <RecordTable.InlineHead label="Status" icon={IconTriangle} />,
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <ClientStatus status={cell.getValue() as string} />
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'cvh_broker',
    accessorKey: 'cvh_broker',
    header: () => <RecordTable.InlineHead label="CVH broker" icon={IconUser} />,
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <MembersInline memberIds={[cell.getValue() as string]} />
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'insurance_types',
    accessorKey: 'insurance_types',
    header: () => (
      <RecordTable.InlineHead label="Insurance types" icon={IconShield} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          {(cell.getValue() as string[])?.map((type: string) => (
            <Badge key={type} variant="secondary">
              {type}
            </Badge>
          ))}
        </RecordTableInlineCell>
      );
    },
    size: 300,
  },
];
