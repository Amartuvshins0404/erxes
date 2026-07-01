import { useQuery } from '@apollo/client';
import { UNIT_OFFERS_FOR_CHART } from '@/unit/graphql/unitStatsQueries';
import { Skeleton } from 'erxes-ui';
import { useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';

const OFFER_COLOR = '#6366f1';

const parseDateLike = (val: any): Date | null => {
  if (!val) return null;
  const num = Number(val);
  const d = new Date(isNaN(num) ? val : num);
  return isNaN(d.getTime()) ? null : d;
};

const formatAmount = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
};

type TooltipState = {
  x: number;
  y: number;
  label: string;
  value: number;
} | null;

export const UnitPriceInsightsChart = ({ unitId }: { unitId: string }) => {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery<{
    blockGetOffersList: { list: { _id: string; amount: number; date: string }[] };
  }>(UNIT_OFFERS_FOR_CHART, {
    variables: { unitId },
    skip: !unitId,
  });

  if (loading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  const offers = [...(data?.blockGetOffersList?.list ?? [])]
    .map((o) => ({ ...o, parsedDate: parseDateLike(o.date) }))
    .filter((o) => o.parsedDate !== null)
    .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());

  if (!offers.length) return null;

  const chartData = offers.map((o) => ({
    label: format(o.parsedDate!, 'MMM yy'),
    amount: o.amount ?? 0,
  }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Price Insights</p>
      <div ref={containerRef} style={{ width: '100%', height: 200, position: 'relative' }}>
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
                <span className="font-medium text-foreground">{formatAmount(tooltip.value)}</span>
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
              <linearGradient id="gradOfferPrice" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={formatAmount}
              width={48}
            />
            <Area
              dataKey="amount"
              type="monotone"
              stroke={OFFER_COLOR}
              fill="url(#gradOfferPrice)"
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
