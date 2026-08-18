import { useQuery } from '@apollo/client';
import { useRef, useState } from 'react';
import {
  PROJECT_CONTRACTS_OVERVIEW,
  PROJECT_OFFERS_OVERVIEW,
  PROJECT_OPPTYS_OVERVIEW,
} from '@/unit/graphql/unitStatsQueries';
import { ScrollArea, Skeleton } from 'erxes-ui';
import {
  IconFileText,
  IconFileDescription,
  IconTarget,
  IconEqual,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import type { ComponentType } from 'react';

const formatAmount = (val: number | null | undefined) => {
  if (val == null) return '—';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString();
};

const formatAmountTick = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
};

const parseDateLike = (val: any): Date | null => {
  if (!val) return null;
  const num = Number(val);
  const d = new Date(isNaN(num) ? val : num);
  return isNaN(d.getTime()) ? null : d;
};

type StageCount = { name: string; count: number };

const OverviewCard = ({
  icon: Icon,
  color,
  title,
  total,
  stages,
  loading,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  title: string;
  total: number;
  stages: StageCount[];
  loading?: boolean;
}) => (
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}18` }}>
        <Icon className="size-4" style={{ color }} />
      </div>
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className="flex items-end gap-6 flex-wrap">
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          {stages.map((s) => (
            <div key={s.name} className="flex flex-col gap-1">
              <span className="text-xl font-bold tabular-nums">{s.count}</span>
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  </div>
);

const AmountCard = ({
  icon: Icon,
  color,
  label,
  value,
  loading,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  label: string;
  value: string;
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

const groupByStatus = (list: { status?: string }[]): StageCount[] => {
  const counts: Record<string, number> = {};
  for (const item of list) {
    const key = item.status ?? 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
  }));
};

const OFFER_COLOR = '#6366f1';

const ProjectPriceInsightsChart = ({
  offers,
}: {
  offers: { _id: string; amount: number; date: string }[];
}) => {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sorted = [...offers]
    .map((o) => ({ ...o, parsedDate: parseDateLike(o.date) }))
    .filter((o) => o.parsedDate !== null)
    .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());

  if (!sorted.length) return null;

  const chartData = sorted.map((o) => ({
    label: format(o.parsedDate!, 'MMM yy'),
    amount: o.amount ?? 0,
  }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Price Insights</p>
      <div ref={containerRef} style={{ width: '100%', height: 220, position: 'relative' }}>
        {tooltip && (() => {
          const containerWidth = containerRef.current?.offsetWidth ?? 0;
          const flipLeft = containerWidth > 0 && tooltip.x > containerWidth / 2;
          return (
            <div
              className="absolute z-10 pointer-events-none rounded-lg border bg-background shadow-md p-2 text-xs"
              style={{
                left: flipLeft ? tooltip.x - 8 : tooltip.x + 12,
                top: Math.max(0, tooltip.y - 36),
                transform: flipLeft ? 'translateX(-100%)' : 'none',
              }}
            >
              <p className="font-medium mb-1 text-foreground">{tooltip.label}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: OFFER_COLOR }}
                />
                <span className="font-medium text-foreground">
                  {formatAmountTick(tooltip.value)}
                </span>
              </div>
            </div>
          );
        })()}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            onMouseMove={(state: any) => {
              const idx = state.activeTooltipIndex;
              if (state.activeCoordinate && idx !== undefined && chartData[idx]) {
                const point = chartData[idx];
                setTooltip({
                  x: state.activeCoordinate.x,
                  y: state.activeCoordinate.y,
                  label: point.label,
                  value: point.amount,
                });
              } else {
                setTooltip(null);
              }
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id="gradProjectOfferPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={OFFER_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={OFFER_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={formatAmountTick}
              width={48}
            />
            <Area
              dataKey="amount"
              type="monotone"
              stroke={OFFER_COLOR}
              fill="url(#gradProjectOfferPrice)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const StackingProjectOverview = ({ projectId }: { projectId: string }) => {
  const { data: contractData, loading: contractLoading } = useQuery<{
    blockGetContractsList: { list: { _id: string; status: string }[]; totalCount: number };
  }>(PROJECT_CONTRACTS_OVERVIEW, { variables: { projectId }, skip: !projectId });

  const { data: offerData, loading: offerLoading } = useQuery<{
    blockGetOffersList: {
      list: { _id: string; status: string; amount: number; date: string }[];
      totalCount: number;
    };
  }>(PROJECT_OFFERS_OVERVIEW, { variables: { projectId }, skip: !projectId });

  const { data: opptyData, loading: opptyLoading } = useQuery<{
    blockGetOpptys: { list: { _id: string; status: string }[]; totalCount: number };
  }>(PROJECT_OPPTYS_OVERVIEW, { variables: { projectId }, skip: !projectId });

  const contracts = contractData?.blockGetContractsList;
  const offers = offerData?.blockGetOffersList;
  const opptys = opptyData?.blockGetOpptys;

  const contractStages = contracts ? groupByStatus(contracts.list) : [];
  const opptyStages = opptys ? groupByStatus(opptys.list) : [];

  const offerAmounts = (offers?.list ?? [])
    .map((o) => o.amount)
    .filter((a) => a != null && a > 0);

  const avgAmount =
    offerAmounts.length > 0
      ? offerAmounts.reduce((s, a) => s + a, 0) / offerAmounts.length
      : null;
  const highestAmount = offerAmounts.length > 0 ? Math.max(...offerAmounts) : null;
  const lowestAmount = offerAmounts.length > 0 ? Math.min(...offerAmounts) : null;

  const sentCount = (offers?.list ?? []).filter((o) => o.status === 'sent').length;
  const draftCount = (offers?.list ?? []).filter((o) => o.status === 'draft').length;

  return (
    <ScrollArea className="flex-auto h-full">
      <div className="p-5 flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-4">
          <OverviewCard
            icon={IconFileText}
            color="#10b981"
            title="Contract Overview"
            total={contracts?.totalCount ?? 0}
            stages={contractStages}
            loading={contractLoading}
          />
          <OverviewCard
            icon={IconFileDescription}
            color="#8b5cf6"
            title="Offer Overview"
            total={offers?.totalCount ?? 0}
            stages={[
              { name: 'Draft', count: draftCount },
              { name: 'Sent', count: sentCount },
            ]}
            loading={offerLoading}
          />
          <OverviewCard
            icon={IconTarget}
            color="#f59e0b"
            title="Opportunity Overview"
            total={opptys?.totalCount ?? 0}
            stages={opptyStages}
            loading={opptyLoading}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <AmountCard
            icon={IconEqual}
            color="#6366f1"
            label="Avg. Offer Amount"
            value={formatAmount(avgAmount)}
            loading={offerLoading}
          />
          <AmountCard
            icon={IconTrendingUp}
            color="#10b981"
            label="Highest Offer"
            value={formatAmount(highestAmount)}
            loading={offerLoading}
          />
          <AmountCard
            icon={IconTrendingDown}
            color="#f59e0b"
            label="Lowest Offer"
            value={formatAmount(lowestAmount)}
            loading={offerLoading}
          />
        </div>

        {offers?.list && <ProjectPriceInsightsChart offers={offers.list} />}
      </div>
      <ScrollArea.Bar orientation="vertical" />
    </ScrollArea>
  );
};
