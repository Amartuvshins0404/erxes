import { useQuery } from '@apollo/client';
import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  PageContainer,
  ScrollArea,
  Skeleton,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import {
  IconChartBar,
  IconCash,
  IconAlertCircle,
  IconClockExclamation,
  IconFlagCheck,
  IconExchange,
  IconArrowUpRight,
  IconArrowDownRight,
  IconChartLine,
  IconCoin,
  IconCreditCard,
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
import { PROJECT_PAYMENT_PLAN_DATA, PROJECT_OFFERS_OVERVIEW, PROJECT_PAYMENT_TRANSACTIONS } from '@/unit/graphql/unitStatsQueries';
import { IContractPayment, IContractPaymentTransaction } from '@/contract-payment/types';
import { PaymentsRecordTable } from '@/contract-payment/components/PaymentsRecordTable';
import { PaymentTransactionsSheet } from '@/contract-payment/components/PaymentTransactionsSheet';
import type { ComponentType } from 'react';

type Period = 'monthly' | 'yearly';

const EXPECTED_COLOR = '#6366f1';
const RECEIVED_COLOR = '#10b981';

const formatAmount = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toLocaleString();
};

const parseDateLike = (val: any): Date | null => {
  if (!val) return null;
  const num = Number(val);
  const d = new Date(isNaN(num) ? val : num);
  return isNaN(d.getTime()) ? null : d;
};

const bucketKey = (d: Date, period: Period) =>
  period === 'yearly' ? format(d, 'yyyy') : format(d, 'yyyy-MM');

const bucketLabel = (d: Date, period: Period) =>
  period === 'yearly' ? format(d, 'yyyy') : format(d, 'MMM yy');

// ── shared sub-components ──────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  color,
  label,
  value,
  sub,
  loading,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) => (
  <div className="rounded-xl border bg-card p-5 flex gap-4 items-center">
    <div className="rounded-full p-2.5 shrink-0" style={{ backgroundColor: `${color}20` }}>
      <Icon className="size-5" style={{ color }} />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="text-2xl font-bold tabular-nums truncate">{value}</div>
      )}
      {sub && !loading && (
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      )}
    </div>
  </div>
);

type TooltipEntry = { dataKey: string; value: number; color: string };
type TooltipState = { x: number; y: number; label: string; entries: TooltipEntry[] } | null;

// ── chart helpers ──────────────────────────────────────────────────────────

function buildPaymentChartData(payments: IContractPayment[], period: Period) {
  const buckets = new Map<string, { label: string; expected: number; received: number }>();

  [...payments]
    .map((p) => ({ ...p, d: parseDateLike(p.dueDate) }))
    .filter((p): p is typeof p & { d: Date } => p.d !== null && p.d.getFullYear() < 2099)
    .sort((a, b) => a.d.getTime() - b.d.getTime())
    .forEach((p) => {
      const key = bucketKey(p.d, period);
      const slot = buckets.get(key) ?? { label: bucketLabel(p.d, period), expected: 0, received: 0 };
      slot.expected += p.amount ?? 0;
      slot.received += p.paidAmount ?? 0;
      buckets.set(key, slot);
    });

  let cumExp = 0;
  let cumRec = 0;
  return Array.from(buckets.values()).map((b) => {
    cumExp += b.expected;
    cumRec += b.received;
    return { label: b.label, expected: cumExp, received: cumRec };
  });
}

function buildOfferChartData(offers: { amount: number; date: string }[], period: Period) {
  const now = new Date();
  return [...offers]
    .map((o) => ({ ...o, d: parseDateLike(o.date) }))
    .filter((o): o is typeof o & { d: Date } => {
      if (o.d === null) return false;
      if (period === 'monthly') {
        return o.d.getFullYear() === now.getFullYear() && o.d.getMonth() === now.getMonth();
      }
      return o.d.getFullYear() === now.getFullYear();
    })
    .sort((a, b) => a.d.getTime() - b.d.getTime())
    .map((o) => ({ label: format(o.d, period === 'monthly' ? 'dd MMM' : 'MMM yy'), amount: o.amount ?? 0 }));
}

// ── chart components ───────────────────────────────────────────────────────

const PaymentPerformanceChart = ({
  payments,
  period,
}: {
  payments: IContractPayment[];
  period: Period;
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartData = buildPaymentChartData(payments, period);

  if (!chartData.length) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        No payment data available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {period === 'yearly' ? 'Annual' : 'Monthly'} Revenue Trend
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: EXPECTED_COLOR }} />
            Expected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: RECEIVED_COLOR }} />
            Received
          </span>
        </div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 240, position: 'relative' }}>
        {tooltip && (() => {
          const cw = containerRef.current?.offsetWidth ?? 0;
          const flip = cw > 0 && tooltip.x > cw / 2;
          return (
            <div
              className="absolute z-10 pointer-events-none rounded-lg border bg-background shadow-md p-2 text-xs"
              style={{
                left: flip ? tooltip.x - 8 : tooltip.x + 12,
                top: Math.max(0, tooltip.y - 52),
                transform: flip ? 'translateX(-100%)' : 'none',
              }}
            >
              <p className="font-medium mb-1">{tooltip.label}</p>
              {tooltip.entries.map((e) => (
                <div key={e.dataKey} className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-muted-foreground capitalize">{e.dataKey}:</span>
                  <span className="font-medium">{formatAmount(e.value)}</span>
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
                const pt = chartData[idx];
                setTooltip({
                  x: state.activeCoordinate.x,
                  y: state.activeCoordinate.y,
                  label: pt.label,
                  entries: [
                    { dataKey: 'expected', value: pt.expected, color: EXPECTED_COLOR },
                    { dataKey: 'received', value: pt.received, color: RECEIVED_COLOR },
                  ],
                });
              } else {
                setTooltip(null);
              }
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id="ovGradExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={EXPECTED_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={EXPECTED_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ovGradRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={RECEIVED_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={RECEIVED_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={formatAmount} width={52} />
            <Area dataKey="expected" type="monotone" stroke={EXPECTED_COLOR} fill="url(#ovGradExp)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Area dataKey="received" type="monotone" stroke={RECEIVED_COLOR} fill="url(#ovGradRec)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── page ───────────────────────────────────────────────────────────────────

export const OverviewPage = () => {
  const { projectId } = useParams();
  const [period, setPeriod] = useState<Period>('monthly');

  const { data: paymentData, loading: paymentLoading } = useQuery<{
    blockGetProjectPaymentPlanData: IContractPayment[];
  }>(PROJECT_PAYMENT_PLAN_DATA, {
    variables: { projectId },
    skip: !projectId,
  });

  const { data: offerData, loading: offerLoading } = useQuery<{
    blockGetOffersList: { list: { _id: string; status: string; amount: number; date: string }[] };
  }>(PROJECT_OFFERS_OVERVIEW, {
    variables: { projectId },
    skip: !projectId,
  });

  const { data: txData, loading: txLoading } = useQuery<{
    blockGetProjectPaymentTransactions: IContractPaymentTransaction[];
  }>(PROJECT_PAYMENT_TRANSACTIONS, {
    variables: { projectId },
    skip: !projectId,
    fetchPolicy: 'cache-and-network',
  });

  const rawPayments = paymentData?.blockGetProjectPaymentPlanData ?? [];
  const _sortNow = Date.now();
  const payments = [...rawPayments].sort((a, b) => {
    const priority = (p: IContractPayment) => {
      if (p.status === 'paid') return 2;
      const due = parseDateLike(p.dueDate)?.getTime() ?? 0;
      if (due && due < _sortNow) return 0;
      return 1;
    };
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    const da = parseDateLike(a.dueDate)?.getTime() ?? 0;
    const db = parseDateLike(b.dueDate)?.getTime() ?? 0;
    return da - db;
  });
  const offers = offerData?.blockGetOffersList?.list ?? [];
  const transactions = txData?.blockGetProjectPaymentTransactions ?? [];
  const now = Date.now();
  const nowDate = new Date(now);
  const currentYear = nowDate.getFullYear();
  const currentMonth = nowDate.getMonth();

  const isInPeriod = (d: Date): boolean => {
    if (period === 'monthly') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    return d.getFullYear() === currentYear;
  };

  const installments = payments.filter((p) => {
    if (p.label === 'Barter') return false;
    const d = parseDateLike(p.dueDate);
    if (!d || d.getFullYear() >= 2099) return false;
    return isInPeriod(d);
  });
  const barterPayments = payments.filter((p) => p.label === 'Barter');
  const completionPayments = payments.filter((p) => {
    const d = parseDateLike(p.dueDate);
    return d !== null && d.getFullYear() >= 2099;
  });

  const totalExpected = installments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalReceived = installments.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
  const shortfall = Math.max(0, totalExpected - totalReceived);
  const collectionRate = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
  const overdueCount = installments.filter((p) => {
    if (p.status === 'paid') return false;
    const due = parseDateLike(p.dueDate)?.getTime() ?? 0;
    return due > 0 && due < now;
  }).length;

  const completionAmount = completionPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const completionReceived = completionPayments.reduce((s, p) => s + (p.paidAmount ?? 0), 0);

  const barterAmount = barterPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const barterReceived = barterPayments.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
  const barterOverdueCount = barterPayments.filter((p) => {
    if (p.status === 'paid') return false;
    const due = parseDateLike(p.dueDate)?.getTime() ?? 0;
    return due > 0 && due < now;
  }).length;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/block/project/${projectId}/overview`}>
                    <IconChartBar />
                    Overview
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        {!paymentLoading && totalExpected > 0 && (
          <PageHeader.End>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: collectionRate >= 100 ? '#10b98120' : collectionRate >= 50 ? '#6366f120' : '#f59e0b20',
                color: collectionRate >= 100 ? '#10b981' : collectionRate >= 50 ? '#6366f1' : '#f59e0b',
              }}
            >
              {collectionRate}% collected
            </span>
          </PageHeader.End>
        )}
      </PageHeader>

      {/* Period tabs */}
      <div className="border-b px-5 flex items-center gap-1">
        {(['monthly', 'yearly'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`relative py-3 px-1 mr-3 text-sm font-medium capitalize focus:outline-none ${
              period === p ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
            {period === p && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-auto h-full">
        <div className="p-5 flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-6 gap-4">
            <StatCard
              icon={IconCash}
              color="#6366f1"
              label="Total Expected"
              value={`₮ ${formatAmount(totalExpected)}`}
              sub={period === 'monthly' ? 'This month' : 'This year'}
              loading={paymentLoading}
            />
            <StatCard
              icon={IconCash}
              color="#10b981"
              label="Total Received"
              value={`₮ ${formatAmount(totalReceived)}`}
              sub={totalExpected > 0 ? `${collectionRate}% collection rate` : undefined}
              loading={paymentLoading}
            />
            <StatCard
              icon={IconClockExclamation}
              color="#ef4444"
              label="Overdue"
              value={String(overdueCount)}
              sub={overdueCount > 0 ? `${overdueCount} installments` : 'None overdue'}
              loading={paymentLoading}
            />
            <StatCard
              icon={IconAlertCircle}
              color="#f59e0b"
              label="Shortfall"
              value={`₮ ${formatAmount(shortfall)}`}
              sub={totalExpected > 0 ? `${100 - collectionRate}% below target` : undefined}
              loading={paymentLoading}
            />
            <StatCard
              icon={IconFlagCheck}
              color="#8b5cf6"
              label="Completion Payment"
              value={`₮ ${formatAmount(completionAmount)}`}
              sub={completionAmount > 0 ? (completionReceived >= completionAmount ? 'Paid' : 'Pending on handover') : undefined}
              loading={paymentLoading}
            />
            <StatCard
              icon={IconExchange}
              color="#0ea5e9"
              label="Barter Payment"
              value={`₮ ${formatAmount(barterAmount)}`}
              sub={
                barterAmount === 0
                  ? undefined
                  : barterReceived >= barterAmount
                  ? 'Received'
                  : barterOverdueCount > 0
                  ? `${barterOverdueCount} overdue`
                  : 'Pending'
              }
              loading={paymentLoading}
            />
          </div>

          {/* Payment performance chart */}
          {paymentLoading ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : (
            <div className="rounded-xl border bg-card p-5">
              <PaymentPerformanceChart payments={payments} period={period} />
            </div>
          )}

          {/* Price insights stats */}
          {offerLoading ? (
            <Skeleton className="h-[120px] w-full rounded-xl" />
          ) : offers.length > 0 ? (() => {
            const periodOffers = buildOfferChartData(offers, period);
            const amounts = periodOffers.map((o) => o.amount).filter((a) => a > 0);
            const avgAmount = amounts.length ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length) : 0;
            const highestAmount = amounts.length ? Math.max(...amounts) : 0;
            const lowestAmount = amounts.length ? Math.min(...amounts) : 0;
            return (
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  icon={IconChartLine}
                  color="#6366f1"
                  label="Avg. Offer Amount"
                  value={`₮ ${formatAmount(avgAmount)}`}
                  sub={period === 'monthly' ? 'This month' : 'This year'}
                  loading={false}
                />
                <StatCard
                  icon={IconArrowUpRight}
                  color="#10b981"
                  label="Highest Offer"
                  value={`₮ ${formatAmount(highestAmount)}`}
                  loading={false}
                />
                <StatCard
                  icon={IconArrowDownRight}
                  color="#f59e0b"
                  label="Lowest Offer"
                  value={`₮ ${formatAmount(lowestAmount)}`}
                  loading={false}
                />
              </div>
            );
          })() : null}

          {/* Transaction history */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Transaction History</p>
            {txLoading && !transactions.length ? (
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
                        <div className="rounded-full p-2 shrink-0" style={{ backgroundColor: '#10b98120' }}>
                          <IconCoin className="size-4" style={{ color: '#10b981' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            {tx.amount?.toLocaleString()} ₮
                          </div>
                          {tx.note && (
                            <div className="text-xs text-muted-foreground truncate">{tx.note}</div>
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
                            {tx.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment schedule */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Payment Schedule</p>
            <PaymentsRecordTable
              payments={payments}
              loading={paymentLoading}
              tableId="overview_payment_schedule"
              showUnit
              className="!h-auto !overflow-visible"
            />
            <PaymentTransactionsSheet />
          </div>
        </div>
        <ScrollArea.Bar orientation="vertical" />
      </ScrollArea>
    </PageContainer>
  );
};
