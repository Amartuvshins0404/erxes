import { useQuery } from '@apollo/client';
import { GET_UNIT_PAYMENT_PLAN_DATA } from '@/unit/graphql/unitStatsQueries';
import { IContractPayment } from '@/contract-payment/types';
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

const EXPECTED_COLOR = '#6366f1';
const RECEIVED_COLOR = '#10b981';

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
  payload: { dataKey: string; value: number; color: string }[];
} | null;

export const UnitPaymentPlanChart = ({ unitId }: { unitId: string }) => {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery<{
    blockGetUnitPaymentPlanData: IContractPayment[];
  }>(GET_UNIT_PAYMENT_PLAN_DATA, {
    variables: { unitId },
    skip: !unitId,
  });

  if (loading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  const payments = [...(data?.blockGetUnitPaymentPlanData ?? [])].sort(
    (a, b) =>
      (parseDateLike(a.dueDate)?.getTime() ?? 0) -
      (parseDateLike(b.dueDate)?.getTime() ?? 0),
  );

  if (!payments.length) return null;

  let cumExpected = 0;
  let cumReceived = 0;

  const chartData = payments.map((p) => {
    cumExpected += p.amount ?? 0;
    cumReceived += p.paidAmount ?? 0;
    const d = parseDateLike(p.dueDate);
    return {
      label: d ? format(d, 'MMM yy') : `#${p.index}`,
      expected: cumExpected,
      received: cumReceived,
    };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-4 rounded"
            style={{ backgroundColor: EXPECTED_COLOR }}
          />
          Expected
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-4 rounded"
            style={{ backgroundColor: RECEIVED_COLOR }}
          />
          Received
        </span>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 200, position: 'relative' }}>
        {tooltip && (() => {
          const containerWidth = containerRef.current?.offsetWidth ?? 0;
          const flipLeft = containerWidth > 0 && tooltip.x > containerWidth / 2;
          return (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border bg-background shadow-md p-2 text-xs"
            style={{
              left: flipLeft ? tooltip.x - 8 : tooltip.x + 12,
              top: Math.max(0, tooltip.y - 48),
              transform: flipLeft ? 'translateX(-100%)' : 'none',
            }}
          >
            <p className="font-medium mb-1 text-foreground">{tooltip.label}</p>
            {tooltip.payload.map((entry) => (
              <div key={entry.dataKey} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground capitalize">
                  {entry.dataKey}:
                </span>
                <span className="font-medium text-foreground">
                  {formatAmount(entry.value)}
                </span>
              </div>
            ))}
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
                  payload: [
                    { dataKey: 'expected', value: point.expected, color: EXPECTED_COLOR },
                    { dataKey: 'received', value: point.received, color: RECEIVED_COLOR },
                  ],
                });
              } else {
                setTooltip(null);
              }
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={EXPECTED_COLOR}
                  stopOpacity={0.25}
                />
                <stop offset="95%" stopColor={EXPECTED_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={RECEIVED_COLOR}
                  stopOpacity={0.25}
                />
                <stop offset="95%" stopColor={RECEIVED_COLOR} stopOpacity={0} />
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
              dataKey="expected"
              type="monotone"
              stroke={EXPECTED_COLOR}
              fill="url(#gradExpected)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              dataKey="received"
              type="monotone"
              stroke={RECEIVED_COLOR}
              fill="url(#gradReceived)"
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
