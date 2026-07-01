/* eslint-disable react-hooks/rules-of-hooks */
import { IOffer } from '@/offer/types/offerTypes';
import { offerDetailSheetState } from '@/offer/states/offerDetailSheetState';
import {
  IconCalendar,
  IconCoin,
  IconDots,
  IconHash,
  IconMail,
  IconPencil,
  IconProgressCheck,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  CurrencyDisplay,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { format } from 'date-fns';
import { CustomersInline, CompaniesInline, MembersInline } from 'ui-modules';
import { useSetAtom } from 'jotai';

const parseDate = (value: any) => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

export const offersColumns = (): ColumnDef<IOffer>[] => {
  const checkBoxColumn = RecordTable.checkboxColumn as ColumnDef<IOffer>;

  return [
    checkBoxColumn,
    {
      id: 'number',
      accessorKey: 'number',
      header: () => <RecordTable.InlineHead label="Number" icon={IconHash} />,
      cell: ({ cell }) => {
        const number = cell.getValue() as string;
        const offerId = cell.row.original._id;
        const setActiveOffer = useSetAtom(offerDetailSheetState);
        return (
          <RecordTableInlineCell.Anchor
            className="ml-2 cursor-pointer"
            onClick={() => offerId && setActiveOffer(offerId)}
          >
            #{number || offerId?.slice(-6)}
          </RecordTableInlineCell.Anchor>
        );
      },
      size: 120,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <RecordTable.InlineHead label="Status" icon={IconProgressCheck} />
      ),
      cell: ({ cell }) => {
        const status = cell.getValue() as IOffer['status'];
        return (
          <RecordTableInlineCell>
            <Badge variant={status === 'sent' ? 'default' : 'secondary'}>
              {status === 'sent' ? 'Sent' : 'Draft'}
            </Badge>
          </RecordTableInlineCell>
        );
      },
      size: 110,
    },
    {
      id: 'party',
      accessorKey: 'party',
      header: () => <RecordTable.InlineHead label="Party" icon={IconUser} />,
      cell: ({ cell }) => {
        const party = cell.getValue() as IOffer['party'];
        return (
          <RecordTableInlineCell>
            {!party?.id ? (
              <span className="text-muted-foreground">-</span>
            ) : party.type === 'customer' ? (
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
      size: 220,
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
                {currency && <CurrencyDisplay variant="icon" code={currency} />}
                {amount.toLocaleString()}
              </span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 160,
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
      size: 150,
    },
    {
      id: 'endDate',
      accessorKey: 'endDate',
      header: () => (
        <RecordTable.InlineHead label="Expiry" icon={IconCalendar} />
      ),
      cell: ({ cell }) => {
        const d = parseDate(cell.getValue());
        const isExpired = d ? d < new Date() : false;
        return (
          <RecordTableInlineCell>
            {d ? (
              <span className={isExpired ? 'text-destructive' : ''}>
                {format(d, 'MMM dd, yyyy')}
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </RecordTableInlineCell>
        );
      },
      size: 150,
    },
    {
      id: 'user',
      accessorKey: 'user',
      header: () => (
        <RecordTable.InlineHead label="Assigned" icon={IconUserCircle} />
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
    {
      id: 'actions',
      header: () => <span />,
      cell: ({ cell }) => {
        const offerId = cell.row.original._id;
        const setActiveOffer = useSetAtom(offerDetailSheetState);
        return (
          <RecordTableInlineCell>
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="blk:min-w-36" align="end">
                <DropdownMenu.Item
                  className="cursor-pointer"
                  onClick={() => offerId && setActiveOffer(offerId)}
                >
                  <IconPencil className="size-4" />
                  <span>Edit</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="cursor-pointer">
                  <IconMail className="size-4" />
                  <span>Send via Email</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </RecordTableInlineCell>
        );
      },
      size: 50,
    },
  ];
};
