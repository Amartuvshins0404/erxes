/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  RecordTable,
  TextOverflowTooltip,
  RecordTableInlineCell,
  Button,
} from 'erxes-ui';
import { ICVMarket } from '../marketsTypes';
import {
  IconBuilding,
  IconLabelFilled,
  IconMapPin,
  IconNumber,
  IconWorld,
} from '@tabler/icons-react';
import {
  MARKET_TYPE_OPTIONS,
  MARKET_SPECIALIZATION_OPTIONS,
  MARKET_REGION_OPTIONS,
} from '../constants/marketTypes';
import { MarketStatus } from './MarketStatus';
import { useQueryState } from 'erxes-ui';

export const marketsColumns: ColumnDef<ICVMarket>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <RecordTable.InlineHead label="Name" icon={IconLabelFilled} />
    ),
    cell: ({ cell, row }) => {
      const [, setActiveMarketId] = useQueryState<string>('activeMarketId');
      return (
        <RecordTableInlineCell
          onClick={() => setActiveMarketId(row.original._id)}
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
    id: 'type',
    accessorKey: 'type',
    header: () => (
      <RecordTable.InlineHead label="Type" icon={IconBuilding} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          {
            MARKET_TYPE_OPTIONS.find((type) => type.value === cell.getValue())
              ?.label
          }
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'specialization',
    accessorKey: 'specialization',
    header: () => (
      <RecordTable.InlineHead label="Specialization" icon={IconBuilding} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          {
            MARKET_SPECIALIZATION_OPTIONS.find(
              (spec) => spec.value === cell.getValue(),
            )?.label
          }
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'region',
    accessorKey: 'region',
    header: () => (
      <RecordTable.InlineHead label="Region" icon={IconWorld} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          {
            MARKET_REGION_OPTIONS.find((region) => region.value === cell.getValue())
              ?.label
          }
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'country',
    accessorKey: 'country',
    header: () => (
      <RecordTable.InlineHead label="Country" icon={IconMapPin} />
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
    id: 'onboarding_status',
    accessorKey: 'onboarding_status',
    header: () => (
      <RecordTable.InlineHead label="Onboarding Status" icon={IconLabelFilled} />
    ),
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell>
          <MarketStatus status={cell.getValue() as string} />
        </RecordTableInlineCell>
      );
    },
  },
];

