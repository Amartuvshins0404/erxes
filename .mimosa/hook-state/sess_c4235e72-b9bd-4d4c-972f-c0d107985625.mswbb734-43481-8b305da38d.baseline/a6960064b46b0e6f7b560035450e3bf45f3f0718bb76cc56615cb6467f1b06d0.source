import {
  IconFileDescription,
  IconSend,
  IconTrendingUp,
  IconTrendingDown,
  IconEqual,
} from '@tabler/icons-react';
import { useUnitOfferStats } from '@/unit/hooks/useUnitStats';
import { UnitStatCard } from './UnitStatCard';
import { Card, Skeleton } from 'erxes-ui';

const formatAmount = (val: number | null, currency?: string | null) => {
  if (val == null) return '—';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString();
};

const AmountCard = ({
  label,
  value,
  loading,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  loading: boolean;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) => (
  <Card className="flex items-center gap-4 p-4">
    <div className="rounded-full p-2.5 shrink-0" style={{ backgroundColor: `${color}20` }}>
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

export const UnitOfferStats = ({ unitId }: { unitId?: string }) => {
  const { stats, loading } = useUnitOfferStats(unitId);

  const currency = stats?.currency ?? null;

  return (
    <>
      <UnitStatCard
        label="Total Offers"
        count={stats?.totalCount}
        loading={loading}
        icon={IconFileDescription}
        color="#6366f1"
      />
      <UnitStatCard
        label="Sent Offers"
        count={stats?.sentCount}
        loading={loading}
        icon={IconSend}
        color="#3b82f6"
      />
      <AmountCard
        label="Avg. Offer Amount"
        value={formatAmount(stats?.averageAmount ?? null, currency)}
        loading={loading}
        icon={IconEqual}
        color="#8b5cf6"
      />
      <AmountCard
        label="Highest Offer"
        value={formatAmount(stats?.highestAmount ?? null, currency)}
        loading={loading}
        icon={IconTrendingUp}
        color="#10b981"
      />
      <AmountCard
        label="Lowest Offer"
        value={formatAmount(stats?.lowestAmount ?? null, currency)}
        loading={loading}
        icon={IconTrendingDown}
        color="#f59e0b"
      />
    </>
  );
};
