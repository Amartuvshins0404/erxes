/* eslint-disable react-hooks/rules-of-hooks */
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';
import { IContract, ContractPartyType } from '@/contract/types/contractTypes';
import { IBlockContractStatus } from '@/contract-status/types';
import {
  IconHash,
  IconProgressCheck,
  IconUser,
  IconCoin,
  IconCalendar,
  IconUserCircle,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  CurrencyDisplay,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { useSetAtom } from 'jotai';
import { format } from 'date-fns';
import { CustomersInline, CompaniesInline, MembersInline } from 'ui-modules';

const parseDate = (value: any) => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

export const contractsColumns = (
  statuses: IBlockContractStatus[],
): ColumnDef<IContract>[] => {
  const checkBoxColumn = RecordTable.checkboxColumn as ColumnDef<IContract>;

  return [
    checkBoxColumn,
    {
      id: 'number',
      accessorKey: 'number',
      header: () => <RecordTable.InlineHead label="Number" icon={IconHash} />,
      cell: ({ cell }) => {
        const number = cell.getValue() as string;
        const setActiveContract = useSetAtom(contractDetailSheetState);

        return (
          <RecordTableInlineCell.Anchor
            className="cursor-pointer ml-2"
            onClick={() => setActiveContract(cell.row.original._id)}
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
      id: 'party',
      accessorKey: 'party',
      header: () => <RecordTable.InlineHead label="Party" icon={IconUser} />,
      cell: ({ cell }) => {
        const party = cell.getValue() as IContract['party'];
        return (
          <RecordTableInlineCell>
            {!party ? (
              <span className="text-muted-foreground">-</span>
            ) : party.type === ContractPartyType.CUSTOMER ? (
              <CustomersInline.Provider customerIds={[party.id]}>
                <span className="inline-flex items-center gap-2 overflow-hidden">
                  <CustomersInline.Avatar />
                  <CustomersInline.Title />
                </span>
              </CustomersInline.Provider>
            ) : (
              <CompaniesInline.Provider companyIds={[party.id]}>
                <span className="inline-flex items-center gap-2 overflow-hidden">
                  <CompaniesInline.Avatar />
                  <CompaniesInline.Title />
                </span>
              </CompaniesInline.Provider>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 240,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: () => <RecordTable.InlineHead label="Amount" icon={IconCoin} />,
      cell: ({ cell }) => {
        const amount = cell.getValue() as number;
        const currency = cell.row.original.currency;
        return (
          <RecordTableInlineCell>
            {!amount ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <span className="flex items-center gap-1">
                {currency && (
                  <CurrencyDisplay variant="icon" code={currency} />
                )}
                {amount.toLocaleString()}
              </span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 170,
    },
    {
      id: 'date',
      accessorKey: 'date',
      header: () => <RecordTable.InlineHead label="Date" icon={IconCalendar} />,
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
      id: 'user',
      accessorKey: 'user',
      header: () => (
        <RecordTable.InlineHead label="User" icon={IconUserCircle} />
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
