import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { IconChartBar } from '@tabler/icons-react';
import { ChartContainer, DatePicker, Select, Skeleton } from 'erxes-ui';
import {
  addDays,
  addMonths,
  endOfDay,
  format,
  parse,
  startOfDay,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { OneFitPageLayout } from '~/components/OneFitPageLayout';
import { ONE_FIT_MEMBERSHIP_PURCHASE_REPORT } from '~/modules/membership-purchase/graphql/membershipPurchaseReportQueries';

type ReportPreset = '1w' | '2w' | '1m' | '2m' | '1y';

type ReportRangeMode = ReportPreset | 'custom';

type ReportInterval = 'day' | 'week' | 'month';

type ReportBucketRow = { periodKey: string; purchaseCount: number };

type PlanShareRow = {
  planId: string;
  planName: string;
  purchaseCount: number;
  percent: number;
};

function getRangeByPreset(preset: ReportPreset): { from: Date; to: Date } {
  const now = new Date();
  const to = endOfDay(now);

  if (preset === '1w') {
    return { from: startOfDay(subWeeks(now, 1)), to };
  }
  if (preset === '2w') {
    return { from: startOfDay(subWeeks(now, 2)), to };
  }
  if (preset === '1m') {
    return { from: startOfDay(subMonths(now, 1)), to };
  }
  if (preset === '2m') {
    return { from: startOfDay(subMonths(now, 2)), to };
  }
  return { from: startOfDay(subYears(now, 1)), to };
}

function formatPeriodLabel(
  periodKey: string,
  interval: ReportInterval,
): string {
  if (interval === 'month') {
    const d = parse(`${periodKey}-01`, 'yyyy-MM-dd', new Date());
    return Number.isNaN(d.getTime()) ? periodKey : format(d, 'MMM yyyy');
  }
  if (interval === 'day') {
    const d = parse(periodKey, 'yyyy-MM-dd', new Date());
    return Number.isNaN(d.getTime()) ? periodKey : format(d, 'MMM d, yyyy');
  }
  return periodKey;
}

function collectPeriodKeys(
  from: Date,
  to: Date,
  interval: ReportInterval,
): string[] {
  if (from.getTime() > to.getTime()) {
    return [];
  }

  if (interval === 'day') {
    const keys: string[] = [];
    let cursor = startOfDay(from);
    const end = startOfDay(to);
    while (cursor.getTime() <= end.getTime()) {
      keys.push(format(cursor, 'yyyy-MM-dd'));
      cursor = addDays(cursor, 1);
    }
    return keys;
  }

  if (interval === 'month') {
    const keys: string[] = [];
    let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cursor.getTime() <= end.getTime()) {
      keys.push(format(cursor, 'yyyy-MM'));
      cursor = addMonths(cursor, 1);
    }
    return keys;
  }

  return [];
}

function mergeReportRows(
  periodKeys: string[],
  rows: Array<{ periodKey: string; purchaseCount: number }>,
  interval: ReportInterval,
) {
  const byKey = new Map(rows.map((r) => [r.periodKey, r]));
  return periodKeys.map((periodKey) => {
    const row = byKey.get(periodKey);
    return {
      periodKey,
      label: formatPeriodLabel(periodKey, interval),
      purchaseCount: row?.purchaseCount ?? 0,
    };
  });
}

const chartConfig = {
  purchaseCount: {
    label: 'Purchases',
    color: '#3b82f6',
  },
};

const planChartConfig = {
  value: {
    label: 'Purchases',
    color: '#10b981',
  },
};

export function MembershipPurchaseReportPage() {
  const initialPreset: ReportPreset = '1m';
  const initialRange = getRangeByPreset(initialPreset);

  const [rangeMode, setRangeMode] = useState<ReportRangeMode>(initialPreset);
  const [customFrom, setCustomFrom] = useState<Date>(initialRange.from);
  const [customTo, setCustomTo] = useState<Date>(initialRange.to);
  const [interval, setInterval] = useState<ReportInterval>('day');

  const { from, to } = useMemo(() => {
    if (rangeMode === 'custom') {
      return {
        from: startOfDay(customFrom),
        to: endOfDay(customTo),
      };
    }
    return getRangeByPreset(rangeMode);
  }, [rangeMode, customFrom, customTo]);

  const handleRangeModeChange = (value: string) => {
    const next = value as ReportRangeMode;
    if (next === 'custom') {
      const seed =
        rangeMode === 'custom'
          ? { from: startOfDay(customFrom), to: endOfDay(customTo) }
          : getRangeByPreset(rangeMode);
      setCustomFrom(startOfDay(seed.from));
      setCustomTo(endOfDay(seed.to));
    }
    setRangeMode(next);
  };

  const { data, loading, error } = useQuery<{
    oneFitMembershipPurchaseReport: ReportBucketRow[];
    oneFitMembershipPurchasePlanShares: PlanShareRow[];
  }>(ONE_FIT_MEMBERSHIP_PURCHASE_REPORT, {
    variables: {
      startDate: from.toISOString(),
      endDate: to.toISOString(),
      interval,
    },
    fetchPolicy: 'cache-and-network',
  });

  const rawRows: ReportBucketRow[] = data?.oneFitMembershipPurchaseReport ?? [];

  const planShares: PlanShareRow[] =
    data?.oneFitMembershipPurchasePlanShares ?? [];

  const planBarData = useMemo(
    () =>
      planShares.map((row) => ({
        planId: row.planId,
        name: row.planName,
        value: row.purchaseCount,
        sharePercent: row.percent,
      })),
    [planShares],
  );

  const chartData = useMemo(() => {
    if (interval === 'week') {
      return [...rawRows]
        .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
        .map((r) => ({
          ...r,
          label: r.periodKey,
        }));
    }
    const periodKeys = collectPeriodKeys(from, to, interval);
    if (periodKeys.length === 0) {
      return rawRows.map((r) => ({
        ...r,
        label: formatPeriodLabel(r.periodKey, interval),
      }));
    }
    return mergeReportRows(periodKeys, rawRows, interval);
  }, [from, to, interval, rawRows]);

  const rangeLabel = `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
  const hasAnyData = chartData.some((row) => row.purchaseCount > 0);
  const hasPlanBarData = planBarData.some((row) => row.value > 0);

  return (
    <OneFitPageLayout
      pageName="Purchase reports"
      pageIcon={<IconChartBar className="size-4" />}
    >
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-auto flex-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Membership purchases
              </h2>
              <p className="text-sm text-gray-500">
                Paid purchases by period and share by plan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={interval}
                onValueChange={(value) => setInterval(value as ReportInterval)}
              >
                <Select.Trigger className="min-w-[140px] border-gray-200">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="day">By day</Select.Item>
                  <Select.Item value="week">By week</Select.Item>
                  <Select.Item value="month">By month</Select.Item>
                </Select.Content>
              </Select>
              <Select value={rangeMode} onValueChange={handleRangeModeChange}>
                <Select.Trigger className="min-w-[200px] border-gray-200">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="1w">Last week</Select.Item>
                  <Select.Item value="2w">Last 2 weeks</Select.Item>
                  <Select.Item value="1m">Last month</Select.Item>
                  <Select.Item value="2m">Last 2 months</Select.Item>
                  <Select.Item value="1y">Last year</Select.Item>
                  <Select.Item value="custom">Custom range</Select.Item>
                </Select.Content>
              </Select>
              {rangeMode === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                  <DatePicker
                    placeholder="Start date"
                    value={customFrom}
                    format="MMM d, yyyy"
                    disabled={(date) =>
                      date > endOfDay(new Date()) ||
                      date < new Date('1900-01-01')
                    }
                    onChange={(d) => {
                      const date = d as Date | undefined;
                      if (!date) return;
                      const next = startOfDay(date);
                      setCustomFrom(next);
                      if (startOfDay(customTo).getTime() < next.getTime()) {
                        setCustomTo(endOfDay(next));
                      }
                    }}
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker
                    placeholder="End date"
                    value={customTo}
                    format="MMM d, yyyy"
                    disabled={(date) =>
                      date < startOfDay(customFrom) ||
                      date > endOfDay(new Date())
                    }
                    onChange={(d) => {
                      const date = d as Date | undefined;
                      if (!date) return;
                      const next = endOfDay(date);
                      setCustomTo(next);
                    }}
                  />
                </div>
              )}
              <span className="text-sm tabular-nums text-gray-600">
                {rangeLabel}
              </span>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600">
              Unable to load report. Please try again.
            </p>
          )}

          {loading && !data ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[min(420px,55vh)] w-full rounded-xl" />
              <Skeleton className="h-[min(420px,55vh)] w-full rounded-xl" />
            </div>
          ) : !hasAnyData && !hasPlanBarData ? (
            <p className="text-sm text-gray-500">
              No paid purchases in this range.
            </p>
          ) : (
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">
                  Purchases over time
                </h3>
                {!hasAnyData ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No purchases in this range for the selected interval.
                  </p>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="mt-4 h-[min(380px,50vh)] w-full"
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e4e4e7"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#52525b', fontSize: 11 }}
                        axisLine={{ stroke: '#a1a1aa' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#52525b', fontSize: 12 }}
                        axisLine={{ stroke: '#a1a1aa' }}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
                      />
                      <Bar
                        dataKey="purchaseCount"
                        name="Purchases"
                        fill="var(--color-purchaseCount)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">
                  By membership plan
                </h3>
                {!hasPlanBarData ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No plan breakdown for this range.
                  </p>
                ) : (
                  <ChartContainer
                    config={planChartConfig}
                    className="mt-4 h-[min(380px,50vh)] w-full min-h-[260px]"
                  >
                    <BarChart
                      data={planBarData}
                      margin={{ top: 8, right: 8, left: 4, bottom: 64 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e4e4e7"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#52525b', fontSize: 11 }}
                        axisLine={{ stroke: '#a1a1aa' }}
                        tickLine={false}
                        interval={0}
                        angle={-28}
                        textAnchor="end"
                        height={72}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#52525b', fontSize: 12 }}
                        axisLine={{ stroke: '#a1a1aa' }}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        formatter={(
                          value: number,
                          _name: string,
                          item: unknown,
                        ) => {
                          const payload = (
                            item as { payload?: { sharePercent?: number } }
                          )?.payload;
                          const pct = payload?.sharePercent;
                          const pctLabel =
                            pct != null ? ` (${pct.toFixed(1)}%)` : '';
                          return [
                            `${Number(value).toLocaleString()}${pctLabel}`,
                            'Purchases',
                          ];
                        }}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as { name?: string })?.name ??
                          ''
                        }
                      />
                      <Bar
                        dataKey="value"
                        name="Purchases"
                        fill="var(--color-value)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </OneFitPageLayout>
  );
}
