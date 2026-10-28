import type { TFunction } from 'i18next';
import { Cell, ColumnDef, Row } from '@tanstack/react-table';
import { IAdjustInvDetail } from '../types/AdjustInventory';
import { Link } from 'react-router-dom';
import {
  RecordTable,
  Input,
  RecordTableInlineCell,
  CurrencyFormatedDisplay,
  CurrencyCode,
  PopoverScoped,
} from 'erxes-ui';
import { IconFile, IconMoneybag } from '@tabler/icons-react';
import { useState } from 'react';

const DescriptionCell = ({ getValue, row }: any) => {
  const [description, setDescription] = useState(getValue() as string);
  const { _id } = row.original;

  return (
    <PopoverScoped scope={`transaction-${_id}-description`}>
      <RecordTableInlineCell.Trigger>
        {getValue() as string}
      </RecordTableInlineCell.Trigger>
      <RecordTableInlineCell.Content>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};

// const DateCell = ({ getValue }: any) => {
//   return (
//     <RecordTableInlineCell>
//       {dayjs(new Date(getValue())).format('YYYY-MM-DD')}
//     </RecordTableInlineCell>
//   );
// };

const ProductCell = ({ row }: any) => {
  return (
    <RecordTableInlineCell>
      {`${row.original.product?.code} - ${row.original.product?.name}`}
    </RecordTableInlineCell>
  );
};

const AccountCell = ({ row }: any) => {
  return (
    <RecordTableInlineCell>
      {`${row.original.account?.code} - ${row.original.account?.name}`}
    </RecordTableInlineCell>
  );
};

const PlaceCell = ({ row }: { row: Row<IAdjustInvDetail> }) => {
  return (
    <RecordTableInlineCell>
      {`${row.original.placeEntity?.code} - ${row.original.placeEntity?.title}`}
    </RecordTableInlineCell>
  );
};

const NumberCell = ({ getValue }: any) => {
  const value = getValue() as number;

  return (
    <RecordTableInlineCell>
      <CurrencyFormatedDisplay
        currencyValue={{
          currencyCode: CurrencyCode.MNT,
          amountMicros: value,
        }}
      />
    </RecordTableInlineCell>
  );
};

const TransactionMoreColumnCell = ({
  cell,
}: {
  cell: Cell<IAdjustInvDetail, unknown>;
}) => {
  const { _id } = cell.row.original;

  return (
    <Link to={`/accounting/adjustment/inventory/detail?id=${_id}`}>
      <RecordTable.MoreButton className="w-full h-full" />
    </Link>
  );
};

const transactionMoreColumn = {
  id: 'more',
  header: () => <RecordTable.ColumnSelector />,
  cell: TransactionMoreColumnCell,
  size: 33,
};

export const adjustDetailTableColumns = (
  t: TFunction<'accounting'>,
): ColumnDef<IAdjustInvDetail>[] => [
  transactionMoreColumn,
  // {
  //   id: 'date',
  //   header: () => <RecordTable.InlineHead icon={IconCalendar} label="Огноо" />,
  //   accessorKey: 'date',
  //   cell: ({ getValue, row }) => <DateCell getValue={getValue} row={row} />,
  // },
  {
    id: 'product',
    header: () => (
      <RecordTable.InlineHead icon={IconMoneybag} label={t('inventory')} />
    ),
    accessorKey: 'product',
    cell: ({ row }) => <ProductCell row={row} />,
    size: 300,
  },
  {
    id: 'account',
    header: () => (
      <RecordTable.InlineHead icon={IconMoneybag} label={t('account')} />
    ),
    accessorKey: 'account',
    cell: ({ row }) => <AccountCell row={row} />,
    size: 300,
  },
  {
    id: 'placeEntity',
    header: () => (
      <RecordTable.InlineHead icon={IconMoneybag} label={t('place', 'Place')} />
    ),
    accessorKey: 'placeEntity',
    cell: ({ row }) => <PlaceCell row={row} />,
    size: 200,
  },
  {
    id: 'remainder',
    header: () => (
      <RecordTable.InlineHead icon={IconMoneybag} label={t('remainder')} />
    ),
    accessorKey: 'remainder',
    cell: ({ getValue }) => <NumberCell getValue={getValue} />,
  },
  {
    id: 'unitCost',
    header: () => (
      <RecordTable.InlineHead icon={IconMoneybag} label={t('unit-cost')} />
    ),
    accessorKey: 'unitCost',
    cell: ({ getValue }) => <NumberCell getValue={getValue} />,
  },
  {
    id: 'cost',
    header: () => (
      <RecordTable.InlineHead icon={IconMoneybag} label={t('total-cost')} />
    ),
    accessorKey: 'cost',
    cell: ({ getValue }) => <NumberCell getValue={getValue} />,
  },
  {
    id: 'description',
    header: () => (
      <RecordTable.InlineHead icon={IconFile} label={t('description')} />
    ),
    accessorKey: 'description',
    cell: ({ getValue, row }) => (
      <DescriptionCell getValue={getValue} row={row} />
    ),
    size: 300,
  },
];
