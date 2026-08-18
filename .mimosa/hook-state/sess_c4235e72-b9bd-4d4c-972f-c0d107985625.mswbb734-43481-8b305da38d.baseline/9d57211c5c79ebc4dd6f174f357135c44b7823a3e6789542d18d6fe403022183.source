import { useQuery } from '@apollo/client';
import { UNIT_OFFER_STATS } from '@/unit/graphql/unitStatsQueries';
import { UnitOverviewCards } from './UnitOverviewCards';
import { UnitPriceInsightsChart } from '../UnitPriceInsightsChart';
import { Skeleton } from 'erxes-ui';
import { IconEqual, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import type { ComponentType } from 'react';

const formatAmount = (val: number | null | undefined) => {
  if (val == null) return '—';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString();
};

const StatCard = ({
  icon: Icon,
  color,
  value,
  label,
  loading,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  value: string | number;
  label: string;
  loading?: boolean;
}) => (
  <div className="flex flex-col gap-3 p-5 rounded-xl border bg-card">
    <div className="rounded-lg p-2 w-fit" style={{ backgroundColor: `${color}18` }}>
      <Icon className="size-5" style={{ color }} />
    </div>
    <div>
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      )}
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </div>
  </div>
);

export const UnitStatsSection = ({
  unitId,
  projectId,
}: {
  unitId?: string;
  projectId?: string;
}) => {
  const { data: offerData, loading: offerLoading } = useQuery<{
    blockGetUnitOfferStats: {
      averageAmount: number | null;
      highestAmount: number | null;
      lowestAmount: number | null;
    };
  }>(UNIT_OFFER_STATS, { variables: { unitId }, skip: !unitId });

  const offers = offerData?.blockGetUnitOfferStats;

  return (
    <div className="flex flex-col gap-4">
      <UnitOverviewCards unitId={unitId} projectId={projectId} />
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={IconEqual}
          color="#6366f1"
          value={formatAmount(offers?.averageAmount)}
          label="Avg. Offer Amount"
          loading={offerLoading}
        />
        <StatCard
          icon={IconTrendingUp}
          color="#10b981"
          value={formatAmount(offers?.highestAmount)}
          label="Highest Offer"
          loading={offerLoading}
        />
        <StatCard
          icon={IconTrendingDown}
          color="#f59e0b"
          value={formatAmount(offers?.lowestAmount)}
          label="Lowest Offer"
          loading={offerLoading}
        />
      </div>
      {unitId && <UnitPriceInsightsChart unitId={unitId} />}
    </div>
  );
};
