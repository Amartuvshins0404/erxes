import { useQuery } from '@apollo/client';
import { GET_UNIT_PAYMENT_TRANSACTIONS } from '@/unit/graphql/unitStatsQueries';
import { IContractPaymentTransaction } from '@/contract-payment/types';
import { Skeleton } from 'erxes-ui';
import { format } from 'date-fns';
import { IconCoin, IconCreditCard } from '@tabler/icons-react';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  online: 'Online',
  other: 'Other',
};

const parseDateLike = (val: any): Date | null => {
  if (!val) return null;
  const num = Number(val);
  const d = new Date(isNaN(num) ? val : num);
  return isNaN(d.getTime()) ? null : d;
};

const formatAmount = (val: number) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    minimumFractionDigits: 0,
  }).format(val);

export const UnitPaymentHistoryTable = ({ unitId }: { unitId: string }) => {
  const { data, loading } = useQuery<{
    blockGetUnitPaymentTransactions: IContractPaymentTransaction[];
  }>(GET_UNIT_PAYMENT_TRANSACTIONS, {
    variables: { unitId },
    skip: !unitId,
    fetchPolicy: 'cache-and-network',
  });

  const transactions = data?.blockGetUnitPaymentTransactions ?? [];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Transaction History</p>
      {loading && !transactions.length ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No transactions recorded yet
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => {
            const d = parseDateLike(tx.date);
            return (
              <div
                key={tx._id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="rounded-full p-2 shrink-0"
                    style={{ backgroundColor: '#10b98120' }}
                  >
                    <IconCoin className="size-4" style={{ color: '#10b981' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">
                      {formatAmount(tx.amount)}
                    </div>
                    {tx.note && (
                      <div className="text-xs text-muted-foreground truncate">
                        {tx.note}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {d ? format(d, 'MMM dd, yyyy') : '-'}
                  </span>
                  {tx.paymentMethod && (
                    <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      <IconCreditCard className="size-3" />
                      {PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
