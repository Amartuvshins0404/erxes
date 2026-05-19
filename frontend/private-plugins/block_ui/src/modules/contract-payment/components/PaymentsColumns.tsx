import {
  Badge,
  Combobox,
  Command,
  PopoverScoped,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { format } from 'date-fns';
import { useState } from 'react';
import { ColumnDef } from '@tanstack/table-core';
import { useSetAtom } from 'jotai';
import {
  IconCalendarFilled,
  IconContract,
  IconCurrency,
  IconHash,
  IconHome,
  IconLabelFilled,
  IconNote,
  IconUser,
} from '@tabler/icons-react';
import { useCustomerDetail } from 'ui-modules';
import { IContractPayment } from '@/contract-payment/types';
import {
  useMarkPaymentPaid,
  useMarkPaymentUnpaid,
} from '@/contract-payment/hooks/usePayments';
import { useUnit } from '@/unit/hooks/useUnit';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';

const parseDateLike = (value: any): Date | null => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: any) => {
  const d = parseDateLike(value);
  return d ? format(d, 'MMM dd, yyyy') : '-';
};

const formatAmount = (val?: number, currency = 'MNT') => {
  if (val == null) return '-';
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(val);
};

const StatusCell = ({ payment }: { payment: IContractPayment }) => {
  const [open, setOpen] = useState(false);
  const { markPaid } = useMarkPaymentPaid();
  const { markUnpaid } = useMarkPaymentUnpaid();

  const isOverdue =
    !payment.paid &&
    !!payment.dueDate &&
    (parseDateLike(payment.dueDate)?.getTime() || 0) < Date.now();

  const label = payment.paid ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid';
  const variant: 'success' | 'destructive' | 'secondary' = payment.paid
    ? 'success'
    : isOverdue
    ? 'destructive'
    : 'secondary';

  const setPaid = async (next: boolean) => {
    setOpen(false);
    if (next && !payment.paid) await markPaid(payment._id);
    if (!next && payment.paid) await markUnpaid(payment._id);
  };

  return (
    <PopoverScoped
      open={open}
      onOpenChange={setOpen}
      scope={`payment-status-${payment._id}`}
    >
      <RecordTableInlineCell.Trigger className="gap-1">
        <Badge variant={variant}>{label}</Badge>
      </RecordTableInlineCell.Trigger>
      <RecordTableInlineCell.Content>
        <Command>
          <Command.List>
            <Command.Item value="unpaid" onSelect={() => setPaid(false)}>
              <Badge variant="secondary">Unpaid</Badge>
              <Combobox.Check checked={!payment.paid} />
            </Command.Item>
            <Command.Item value="paid" onSelect={() => setPaid(true)}>
              <Badge variant="success">Paid</Badge>
              <Combobox.Check checked={!!payment.paid} />
            </Command.Item>
          </Command.List>
        </Command>
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};

const UnitCell = ({ unitId }: { unitId?: string }) => {
  const { unit } = useUnit(unitId);
  return (
    <RecordTableInlineCell>
      {unit?.number ? `Unit ${unit.number}` : '-'}
    </RecordTableInlineCell>
  );
};

const CustomerCell = ({ payment }: { payment: IContractPayment }) => {
  const isCustomer = payment.partyType === 'customer';
  const { customerDetail, loading } = useCustomerDetail(
    {
      variables: { _id: payment.partyId },
      skip: !payment.partyId || !isCustomer,
    },
    true,
  );

  if (!payment.partyId) {
    return <RecordTableInlineCell>-</RecordTableInlineCell>;
  }
  if (!isCustomer) {
    return <RecordTableInlineCell>{payment.partyId}</RecordTableInlineCell>;
  }
  if (loading) {
    return (
      <RecordTableInlineCell>
        <span className="text-muted-foreground">Loading…</span>
      </RecordTableInlineCell>
    );
  }
  const name = customerDetail
    ? [customerDetail.firstName, customerDetail.lastName]
        .filter(Boolean)
        .join(' ') ||
      customerDetail.primaryPhone ||
      customerDetail.primaryEmail ||
      'Unnamed'
    : '-';
  return <RecordTableInlineCell>{name}</RecordTableInlineCell>;
};

const ContractCell = ({ payment }: { payment: IContractPayment }) => {
  const setActiveContract = useSetAtom(contractDetailSheetState);
  return (
    <RecordTableInlineCell>
      <RecordTableInlineCell.Anchor
        onClick={(e) => {
          e.stopPropagation();
          setActiveContract(payment.contractId);
        }}
      >
        {payment.contractNumber || payment.contractId}
      </RecordTableInlineCell.Anchor>
    </RecordTableInlineCell>
  );
};

export type PaymentsColumnOptions = {
  showContract?: boolean;
  showCustomer?: boolean;
  showUnit?: boolean;
};

export const paymentsColumns = ({
  showContract = false,
  showCustomer = false,
  showUnit = false,
}: PaymentsColumnOptions = {}): ColumnDef<IContractPayment>[] => {
  const columns: ColumnDef<IContractPayment>[] = [
    {
      id: 'status',
      header: () => (
        <RecordTable.InlineHead label="Status" icon={IconLabelFilled} />
      ),
      cell: ({ row }) => <StatusCell payment={row.original} />,
      size: 140,
    },
    {
      id: 'label',
      accessorKey: 'label',
      header: () => <RecordTable.InlineHead label="#" icon={IconHash} />,
      cell: ({ row }) => {
        const { label, index } = row.original;
        const display =
          label && /^installment\s+\d+/i.test(label)
            ? String(index)
            : label || String(index);
        return <RecordTableInlineCell>{display}</RecordTableInlineCell>;
      },
      size: 120,
    },
  ];

  if (showContract) {
    columns.push({
      id: 'contract',
      header: () => (
        <RecordTable.InlineHead label="Contract" icon={IconContract} />
      ),
      cell: ({ row }) => <ContractCell payment={row.original} />,
      size: 180,
    });
  }

  if (showCustomer) {
    columns.push({
      id: 'customer',
      header: () => (
        <RecordTable.InlineHead label="Customer" icon={IconUser} />
      ),
      cell: ({ row }) => <CustomerCell payment={row.original} />,
      size: 200,
    });
  }

  if (showUnit) {
    columns.push({
      id: 'unit',
      header: () => <RecordTable.InlineHead label="Unit" icon={IconHome} />,
      cell: ({ row }) => <UnitCell unitId={row.original.unit} />,
      size: 140,
    });
  }

  columns.push(
    {
      id: 'dueDate',
      accessorKey: 'dueDate',
      header: () => (
        <RecordTable.InlineHead label="Due Date" icon={IconCalendarFilled} />
      ),
      cell: ({ row }) => (
        <RecordTableInlineCell>
          {formatDate(row.original.dueDate)}
        </RecordTableInlineCell>
      ),
      size: 160,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: () => (
        <RecordTable.InlineHead label="Amount" icon={IconCurrency} />
      ),
      cell: ({ row }) => (
        <RecordTableInlineCell>
          {formatAmount(row.original.amount, row.original.currency)}
        </RecordTableInlineCell>
      ),
      size: 160,
    },
    {
      id: 'paidAmount',
      accessorKey: 'paidAmount',
      header: () => (
        <RecordTable.InlineHead label="Paid Amount" icon={IconCurrency} />
      ),
      cell: ({ row }) => (
        <RecordTableInlineCell>
          {formatAmount(row.original.paidAmount, row.original.currency)}
        </RecordTableInlineCell>
      ),
      size: 160,
    },
    {
      id: 'paidDate',
      accessorKey: 'paidDate',
      header: () => (
        <RecordTable.InlineHead label="Paid Date" icon={IconCalendarFilled} />
      ),
      cell: ({ row }) => (
        <RecordTableInlineCell>
          {formatDate(row.original.paidDate)}
        </RecordTableInlineCell>
      ),
      size: 160,
    },
    {
      id: 'note',
      accessorKey: 'note',
      header: () => <RecordTable.InlineHead label="Note" icon={IconNote} />,
      cell: ({ row }) => (
        <RecordTableInlineCell>
          {row.original.note || '-'}
        </RecordTableInlineCell>
      ),
      size: 240,
    },
  );

  return columns;
};
