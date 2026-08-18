import { useQuery } from '@apollo/client';
import { GET_UNIT_PAYMENT_PLAN_DATA } from '@/unit/graphql/unitStatsQueries';
import { IContractPayment } from '@/contract-payment/types';
import { Card, Skeleton } from 'erxes-ui';
import {
  IconCash,
  IconAlertCircle,
  IconClockExclamation,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

const formatAmount = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString();
};

const StatCard = ({
  label,
  value,
  loading,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  loading: boolean;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) => (
  <Card className="flex items-center gap-4 p-4">
    <div
      className="rounded-full p-2.5 shrink-0"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="size-5" style={{ color }} />
    </div>
    <div className="min-w-0">
      {loading ? (
        <Skeleton className="h-7 w-16 mb-1" />
      ) : (
        <div className="text-2xl font-bold tabular-nums truncate">{value}</div>
      )}
      <div className="text-sm text-muted-foreground truncate">{label}</div>
    </div>
  </Card>
);

export const UnitSignedContractStats = ({ unitId }: { unitId: string }) => {
  const { data, loading } = useQuery<{
    blockGetUnitPaymentPlanData: IContractPayment[];
  }>(GET_UNIT_PAYMENT_PLAN_DATA, {
    variables: { unitId },
    skip: !unitId,
  });

  const payments = data?.blockGetUnitPaymentPlanData ?? [];
  const now = Date.now();

  const totalExpected = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
  const remaining = Math.max(0, totalExpected - totalPaid);
  const overdueCount = payments.filter((p) => {
    if (p.status === 'paid') return false;
    const due = p.dueDate ? new Date(isNaN(Number(p.dueDate)) ? p.dueDate : Number(p.dueDate)).getTime() : 0;
    return due > 0 && due < now;
  }).length;

  const collectionRate =
    totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Payment Progress</p>
        {!loading && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: collectionRate >= 100 ? '#10b98120' : collectionRate >= 50 ? '#6366f120' : '#f59e0b20',
              color: collectionRate >= 100 ? '#10b981' : collectionRate >= 50 ? '#6366f1' : '#f59e0b',
            }}
          >
            {collectionRate}% collected
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Paid"
          value={formatAmount(totalPaid)}
          loading={loading}
          icon={IconCash}
          color="#10b981"
        />
        <StatCard
          label="Remaining"
          value={formatAmount(remaining)}
          loading={loading}
          icon={IconAlertCircle}
          color="#6366f1"
        />
        <StatCard
          label="Overdue"
          value={String(overdueCount)}
          loading={loading}
          icon={IconClockExclamation}
          color="#ef4444"
        />
      </div>
    </div>
  );
};
