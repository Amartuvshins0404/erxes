import {
  Badge,
  Button,
  CurrencyField,
  DatePicker,
  FocusSheet,
  Select,
  Sheet,
  Spinner,
  Textarea,
  toast,
} from 'erxes-ui';
import {
  IconPlus,
  IconTrash,
  IconCalendar,
  IconCoin,
  IconNote,
  IconCreditCard,
} from '@tabler/icons-react';

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
];
import { useAtom } from 'jotai';
import { format } from 'date-fns';
import { useState } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { paymentSheetState } from '@/contract-payment/states/paymentSheetState';
import {
  useAddPaymentTransaction,
  usePaymentTransactions,
  useRemovePaymentTransaction,
} from '@/contract-payment/hooks/usePayments';
import { IContractPayment } from '@/contract-payment/types';
import { gql } from '@apollo/client';

const GET_PAYMENT = gql`
  query BlockGetPayment($contractId: String!) {
    blockGetContractPayments(contractId: $contractId, limit: 1000) {
      list {
        _id
        contractId
        contractNumber
        index
        label
        dueDate
        amount
        currency
        status
        paidAmount
        paidDate
        penaltyAmount
        overdueDays
      }
    }
  }
`;

const formatAmount = (val?: number, currency = 'MNT') => {
  if (val == null) return '-';
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(val);
};

const parseDateLike = (value: any): Date | null => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

const usePaymentDetail = (paymentId?: string) => {
  const client = useApolloClient();
  const cached = client.cache.extract();
  let found: IContractPayment | null = null;
  if (paymentId) {
    for (const key in cached) {
      const item: any = (cached as any)[key];
      if (
        item?.__typename === 'BlockContractPayment' &&
        item._id === paymentId
      ) {
        found = item;
        break;
      }
    }
  }
  return found;
};

export const PaymentTransactionsSheet = () => {
  const [activePaymentId, setActivePaymentId] = useAtom(paymentSheetState);
  const payment = usePaymentDetail(activePaymentId || undefined);
  const { transactions, loading } = usePaymentTransactions(
    activePaymentId || undefined,
  );

  return (
    <FocusSheet
      open={!!activePaymentId}
      onOpenChange={(open) => !open && setActivePaymentId(null)}
    >
      <FocusSheet.View className="sm:w-full sm:max-w-2xl">
        <FocusSheet.Header title="Payment" />
        <FocusSheet.Content className="flex flex-col flex-auto overflow-hidden">
          {!activePaymentId ? null : !payment ? (
            <div className="flex-auto flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <PaymentBody
              payment={payment}
              transactions={transactions}
              loading={loading}
            />
          )}
        </FocusSheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary">Close</Button>
          </Sheet.Close>
        </Sheet.Footer>
      </FocusSheet.View>
    </FocusSheet>
  );
};

const PaymentBody = ({
  payment,
  transactions,
  loading,
}: {
  payment: IContractPayment;
  transactions: {
    _id: string;
    amount: number;
    date: string;
    note?: string;
  }[];
  loading: boolean;
}) => {
  const [adding, setAdding] = useState(false);
  const due = payment.amount || 0;
  const paid = payment.paidAmount || 0;
  const remaining = Math.max(0, due - paid);
  const currency = payment.currency || 'MNT';

  const statusBadge = (() => {
    if (payment.status === 'paid')
      return <Badge variant="success">Paid</Badge>;
    if (payment.status === 'partial')
      return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="secondary">Unpaid</Badge>;
  })();

  return (
    <div className="flex flex-col gap-4 p-5 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase">
            {payment.label || `Installment ${payment.index}`}
          </div>
          <div className="text-2xl font-semibold mt-1">
            {formatAmount(due, currency)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Due{' '}
            {payment.dueDate
              ? format(parseDateLike(payment.dueDate) as Date, 'MMM dd, yyyy')
              : '-'}
          </div>
        </div>
        <div className="text-right space-y-1">
          {statusBadge}
          <div className="text-sm">
            <span className="text-muted-foreground">Paid: </span>
            <span className="font-medium">{formatAmount(paid, currency)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Remaining: </span>
            <span className="font-medium">
              {formatAmount(remaining, currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Transactions</h4>
          {!adding && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAdding(true)}
            >
              <IconPlus />
              Add payment
            </Button>
          )}
        </div>

        {adding && (
          <AddTransactionForm
            paymentId={payment._id}
            defaultAmount={remaining}
            onDone={() => setAdding(false)}
          />
        )}

        {loading ? (
          <Spinner />
        ) : transactions.length === 0 ? (
          <div className="text-muted-foreground text-sm py-4 text-center">
            No payments recorded yet
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx._id} tx={tx} currency={currency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AddTransactionForm = ({
  paymentId,
  defaultAmount,
  onDone,
}: {
  paymentId: string;
  defaultAmount: number;
  onDone: () => void;
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const { addTransaction, loading } = useAddPaymentTransaction();

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast({ title: 'Amount required', variant: 'destructive' });
      return;
    }
    try {
      await addTransaction({
        paymentId,
        amount,
        date: date.toISOString(),
        note: note || undefined,
        paymentMethod,
      });
      toast({ title: 'Payment added', variant: 'success' });
      onDone();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border rounded-md p-3 flex flex-col gap-3 mb-3 bg-sidebar/30">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <IconCoin className="size-3" />
            Amount
          </label>
          <CurrencyField.ValueInput
            value={amount}
            onChange={(v) => setAmount(v || 0)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <IconCalendar className="size-3" />
            Date
          </label>
          <DatePicker
            value={date}
            onChange={(d) => {
              const v = Array.isArray(d) ? d[0] : d;
              if (v) setDate(v);
            }}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <IconCreditCard className="size-3" />
          Payment method
        </label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <Select.Trigger className="h-8">
            <Select.Value placeholder="Select method" />
          </Select.Trigger>
          <Select.Content>
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <IconNote className="size-3" />
          Note
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          rows={2}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          {loading && <Spinner containerClassName="flex-none" />}
          Save
        </Button>
      </div>
    </div>
  );
};

const TransactionRow = ({
  tx,
  currency,
}: {
  tx: { _id: string; amount: number; date: string; note?: string; paymentMethod?: string };
  currency: string;
}) => {
  const { removeTransaction, loading } = useRemovePaymentTransaction();
  const dateObj = parseDateLike(tx.date);

  const handleRemove = async () => {
    if (!confirm('Delete this payment?')) return;
    try {
      await removeTransaction(tx._id);
      toast({ title: 'Payment removed', variant: 'success' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border rounded-md p-3 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            {formatAmount(tx.amount, currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            {dateObj ? format(dateObj, 'MMM dd, yyyy') : '-'}
          </span>
          {tx.paymentMethod && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
              {PAYMENT_METHOD_OPTIONS.find((o) => o.value === tx.paymentMethod)?.label ?? tx.paymentMethod}
            </span>
          )}
        </div>
        {tx.note && (
          <div className="text-sm text-muted-foreground mt-1">{tx.note}</div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleRemove}
        disabled={loading}
      >
        <IconTrash className="text-destructive" />
      </Button>
    </div>
  );
};
