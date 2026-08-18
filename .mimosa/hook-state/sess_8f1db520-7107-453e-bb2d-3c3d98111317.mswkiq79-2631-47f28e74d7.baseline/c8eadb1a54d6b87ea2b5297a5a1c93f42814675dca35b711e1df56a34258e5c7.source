/* eslint-disable react-hooks/rules-of-hooks */
import { IOppty } from '@/oppty/types/opptyTypes';
import { IBlockStatus } from '@/status/types';
import { IUnitType } from '@/unit/types/unitType';
import {
  IconHash,
  IconProgressCheck,
  IconUser,
  IconFlag,
  IconCalendarEvent,
  IconCalendarTime,
  IconPhone,
  IconCategory,
  IconUserCircle,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  RecordTable,
  RecordTableInlineCell,
  useQueryState,
} from 'erxes-ui';
import { format } from 'date-fns';
import { CustomersInline, MembersInline } from 'ui-modules';
import { SelectCustomerSource } from '@/oppty/components/SelectCustomerSource';

const parseDate = (value: any) => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const opptysColumns = (
  statuses: IBlockStatus[],
  unitTypes?: IUnitType[],
): ColumnDef<IOppty>[] => {
  const checkBoxColumn = RecordTable.checkboxColumn as ColumnDef<IOppty>;

  return [
    checkBoxColumn,
    {
      id: 'number',
      accessorKey: 'number',
      header: () => <RecordTable.InlineHead label="Number" icon={IconHash} />,
      cell: ({ cell }) => {
        const number = cell.getValue() as string;
        const [, setActiveOpptyId] = useQueryState<string>('activeOpptyId');

        return (
          <RecordTableInlineCell.Anchor
            className="cursor-pointer ml-2"
            onClick={() => setActiveOpptyId(cell.row.original._id)}
          >
            #{number || cell.row.original._id}
          </RecordTableInlineCell.Anchor>
        );
      },
      size: 160,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <RecordTable.InlineHead label="Status" icon={IconProgressCheck} />
      ),
      cell: ({ cell }) => {
        const statusId = cell.getValue() as string;
        const status = statuses.find((s) => s._id === statusId);
        return (
          <RecordTableInlineCell>
            {status ? (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: status.color
                    ? `${status.color}20`
                    : undefined,
                  color: status.color || undefined,
                }}
              >
                {status.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 170,
    },
    {
      id: 'customerId',
      accessorKey: 'customerId',
      header: () => (
        <RecordTable.InlineHead label="Customer" icon={IconUser} />
      ),
      cell: ({ cell }) => {
        const customerId = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            {!customerId ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <CustomersInline.Provider customerIds={[customerId]}>
                <span className="inline-flex items-center gap-2 overflow-hidden">
                  <CustomersInline.Avatar />
                  <CustomersInline.Title />
                </span>
              </CustomersInline.Provider>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 240,
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: () => (
        <RecordTable.InlineHead label="Priority" icon={IconFlag} />
      ),
      cell: ({ cell }) => {
        const priority = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            {!priority ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <Badge
                variant="secondary"
                className="capitalize"
                style={{
                  backgroundColor: PRIORITY_COLORS[priority]
                    ? `${PRIORITY_COLORS[priority]}20`
                    : undefined,
                  color: PRIORITY_COLORS[priority] || undefined,
                }}
              >
                {priority}
              </Badge>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 130,
    },
    {
      id: 'customerSource',
      accessorKey: 'customerSource',
      header: () => (
        <RecordTable.InlineHead label="Source" icon={IconPhone} />
      ),
      cell: ({ cell }) => {
        const source = cell.getValue() as string;
        const label = source
          ? SelectCustomerSource.OPTIONS.find((o) => o.value === source)
              ?.label || source
          : null;
        return (
          <RecordTableInlineCell>
            {label ? (
              <Badge variant="secondary">{label}</Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 150,
    },
    {
      id: 'unitType',
      accessorKey: 'unitType',
      header: () => (
        <RecordTable.InlineHead label="Unit Type" icon={IconCategory} />
      ),
      cell: ({ cell }) => {
        const unitTypeId = cell.getValue() as string;
        const unitTypeName = unitTypeId
          ? unitTypes?.find((t) => t._id === unitTypeId)?.name || unitTypeId
          : null;
        return (
          <RecordTableInlineCell>
            {unitTypeName ? (
              <span>{unitTypeName}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 150,
    },
    {
      id: 'startDate',
      accessorKey: 'startDate',
      header: () => (
        <RecordTable.InlineHead label="Start Date" icon={IconCalendarEvent} />
      ),
      cell: ({ cell }) => {
        const d = parseDate(cell.getValue());
        return (
          <RecordTableInlineCell>
            {d ? (
              <span>{format(d, 'MMM dd, yyyy')}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 170,
    },
    {
      id: 'targetDate',
      accessorKey: 'targetDate',
      header: () => (
        <RecordTable.InlineHead label="Target Date" icon={IconCalendarTime} />
      ),
      cell: ({ cell }) => {
        const d = parseDate(cell.getValue());
        return (
          <RecordTableInlineCell>
            {d ? (
              <span>{format(d, 'MMM dd, yyyy')}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 170,
    },
    {
      id: 'assignedUserId',
      accessorKey: 'assignedUserId',
      header: () => (
        <RecordTable.InlineHead label="Assignee" icon={IconUserCircle} />
      ),
      cell: ({ cell }) => {
        const userId = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            {!userId ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <MembersInline.Provider memberIds={[userId]}>
                <span className="inline-flex items-center gap-2 overflow-hidden">
                  <MembersInline.Avatar />
                  <MembersInline.Title />
                </span>
              </MembersInline.Provider>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 180,
    },
  ];
};
