import { DatePicker, InfoCard } from 'erxes-ui';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { format } from 'date-fns';
import { UseFormReturn } from 'react-hook-form';
import { generateInstallmentDates } from './contract-detail/shared';

const periodsPerYear = (frequency: string | undefined): number => {
  switch (frequency) {
    case 'ONE_TIME_PER_MONTH': return 12;
    case 'TWO_TIME_PER_MONTH': return 24;
    case 'THREE_TIME_PER_MONTH': return 36;
    case 'QUARTERLY': return 4;
    case 'HALF_YEARLY': return 2;
    case 'YEARLY': return 1;
    default: return 12;
  }
};

const parseDateLike = (value: any): Date | null => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

const PrincipalInput = memo(({
  index,
  value,
  onCommit,
}: {
  index: number;
  value: number;
  onCommit: (index: number, val: number) => void;
}) => {
  const [text, setText] = useState(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(String(value));
    }
  }, [value]);

  return (
    <input
      type="number"
      step="any"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => { focusedRef.current = true; }}
      onBlur={(e) => {
        focusedRef.current = false;
        const n = parseFloat(e.target.value);
        if (!isNaN(n)) onCommit(index, n);
      }}
      className="h-7 text-sm w-full border rounded px-2 bg-background"
    />
  );
});

export const PaymentScheduleEditor = ({
  form,
  amount: amountProp,
  currency: currencyProp,
  date: dateProp,
}: {
  form: UseFormReturn<any>;
  amount?: number;
  currency?: string;
  date?: string;
}) => {
  const amount = amountProp ?? (form.watch('amount') || 0);
  const currency = currencyProp ?? (form.watch('currency') || 'MNT');
  const contractDate = dateProp ?? form.watch('date');
  const paymentPlan = form.watch('paymentPlan');
  const dueDates = form.watch('paymentPlan.paymentDueDates') || [];
  const savedAmounts = form.getValues('paymentPlan.installmentAmounts');
  const [principalOverrides, setPrincipalOverrides] = useState<Record<number, number>>(() => {
    if (!savedAmounts?.length) return {};
    // 0 means "not set, use computed" — skip zeros
    return Object.fromEntries(
      (savedAmounts as number[])
        .map((v, i) => [i, v] as [number, number])
        .filter(([, v]) => v > 0),
    );
  });

  const handlePrincipalCommit = useCallback((index: number, val: number) => {
    setPrincipalOverrides((prev) => {
      const installments = form.getValues('paymentPlan.installment') || 0;
      const lastIndex = installments - 1;
      // last row is always auto-computed — never store its override
      if (index === lastIndex) return prev;
      const next = { ...prev, [index]: val };
      const amounts = Array.from({ length: installments }, (_, i) =>
        i === lastIndex ? 0 : (next[i] ?? 0),
      );
      form.setValue('paymentPlan.installmentAmounts', amounts, { shouldDirty: true });
      return next;
    });
  }, [form]);

  if (!paymentPlan) return null;

  const downPct = paymentPlan.downPaymentPercentage || 0;
  const barterPct = paymentPlan.barterPercentage || 0;
  const completionPct = paymentPlan.completionPaymentPercentage || 0;
  const discountPct = paymentPlan.discountPercentage || 0;
  const interestPct = paymentPlan.interestPercentage || 0;
  const interestType = paymentPlan.interestType || 'FLAT';
  const frequency = paymentPlan.frequency;
  const isOneTime = frequency === 'ONE_TIME';
  const installmentCount = isOneTime
    ? 0
    : Math.max(0, paymentPlan.installment || 0);
  const ppy = periodsPerYear(frequency);

  if (!amount && installmentCount === 0 && !isOneTime) return null;

  const discountAmount = (amount * discountPct) / 100;
  const priceAfterDiscount = amount - discountAmount;
  const downAmount = (paymentPlan.downPaymentAmount || 0) > 0
    ? paymentPlan.downPaymentAmount!
    : (priceAfterDiscount * downPct) / 100;
  const barterValue = (paymentPlan.barterAmount || 0) > 0
    ? paymentPlan.barterAmount!
    : (priceAfterDiscount * barterPct) / 100;
  const completionAmount = (paymentPlan.completionPaymentAmount || 0) > 0
    ? paymentPlan.completionPaymentAmount!
    : (priceAfterDiscount * completionPct) / 100;
  const principal = priceAfterDiscount - downAmount - barterValue - completionAmount;
  const roundedAmount = paymentPlan.roundedInstallmentAmount || 0;
  const principalPerInstallment =
    installmentCount > 0
      ? roundedAmount > 0
        ? roundedAmount
        : principal / installmentCount
      : 0;

  // Pre-compute all effective principals so last row auto-adjusts
  const effectivePrincipals = Array.from({ length: installmentCount }, (_, i) => {
    const base = roundedAmount > 0 ? roundedAmount : principalPerInstallment;
    return principalOverrides[i] ?? base;
  });
  if (installmentCount > 0) {
    const sumOfOthers = effectivePrincipals.slice(0, -1).reduce((a, b) => a + b, 0);
    const lastFallback = principal - sumOfOthers;
    effectivePrincipals[installmentCount - 1] =
      principalOverrides[installmentCount - 1] ?? lastFallback;
  }

  const baseStart =
    parseDateLike(paymentPlan.firstPaymentDate) ||
    parseDateLike(contractDate) ||
    new Date();
  const autoDates = generateInstallmentDates(
    baseStart,
    installmentCount,
    frequency,
    paymentPlan.paymentDates || [],
  );

  const getDueDate = (index: number): Date | undefined => {
    const override = dueDates[index];
    if (override) {
      const d = parseDateLike(override);
      if (d) return d;
    }
    return autoDates[index];
  };

  const setDueDate = (index: number, date: Date | undefined) => {
    const next = Array.from({ length: installmentCount }, (_, i) => {
      if (i === index) return date?.toISOString() ?? autoDates[i]?.toISOString() ?? '';
      const d = parseDateLike(dueDates[i]) || autoDates[i];
      return d?.toISOString() ?? '';
    });
    form.setValue('paymentPlan.paymentDueDates', next, { shouldDirty: true });
  };

  const getInterest = (index: number) => {
    if (interestPct <= 0 || installmentCount <= 0) return 0;
    if (interestType === 'FLAT') {
      return (principal * interestPct) / 100 / installmentCount;
    }
    if (interestType === 'REDUCING') {
      const paidSoFar = effectivePrincipals.slice(0, index).reduce((a, b) => a + b, 0);
      const remaining = principal - paidSoFar;
      return (remaining * interestPct) / 100 / ppy;
    }
    return ((principal * interestPct) / 100) * (installmentCount / ppy) / installmentCount;
  };

  const fmt = (val: number) =>
    new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(val);

  const hasInterest = interestPct > 0;
  const contractDateLabel = parseDateLike(contractDate);
  const downPaymentDateLabel = parseDateLike(paymentPlan.downPaymentDate) || contractDateLabel;
  let grandTotal = 0;

  const Header = ({ children }: { children: React.ReactNode }) => (
    <div className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase">
      {children}
    </div>
  );
  const Cell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`px-2 py-2 border-t text-sm flex items-center ${className || ''}`}>
      {children}
    </div>
  );

  return (
    <InfoCard title="Payment Schedule (preview)">
      <InfoCard.Content className="shadow-none p-0 overflow-hidden">
        <div
          className={`grid ${
            hasInterest ? 'grid-cols-6' : 'grid-cols-5'
          } bg-sidebar`}
        >
          <Header>Payment</Header>
          <Header>Due Date</Header>
          <Header>Type</Header>
          <Header>Principal</Header>
          {hasInterest && <Header>Interest</Header>}
          <Header>Total</Header>
        </div>
        {isOneTime ? (() => {
          const totalInterest = (priceAfterDiscount * interestPct) / 100;
          const rowTotal = priceAfterDiscount + totalInterest;
          grandTotal = rowTotal;
          return (
            <div
              className={`grid ${
                hasInterest ? 'grid-cols-6' : 'grid-cols-5'
              }`}
            >
              <Cell>Full payment</Cell>
              <Cell>
                {contractDateLabel
                  ? format(contractDateLabel, 'dd.MM.yyyy')
                  : '-'}
              </Cell>
              <Cell>One-time</Cell>
              <Cell>{fmt(priceAfterDiscount)}</Cell>
              {hasInterest && <Cell>{fmt(totalInterest)}</Cell>}
              <Cell>{fmt(rowTotal)}</Cell>
            </div>
          );
        })() : (
          <>
            {barterValue > 0 && (() => {
              grandTotal += barterValue;
              return (
                <div
                  className={`grid ${
                    hasInterest ? 'grid-cols-6' : 'grid-cols-5'
                  }`}
                >
                  <Cell>Barter</Cell>
                  <Cell>
                    {contractDateLabel
                      ? format(contractDateLabel, 'dd.MM.yyyy')
                      : '-'}
                  </Cell>
                  <Cell>Barter</Cell>
                  <Cell>{fmt(barterValue)}</Cell>
                  {hasInterest && <Cell>-</Cell>}
                  <Cell>{fmt(barterValue)}</Cell>
                </div>
              );
            })()}
            {downAmount > 0 && (() => {
              grandTotal += downAmount;
              return (
                <div
                  className={`grid ${
                    hasInterest ? 'grid-cols-6' : 'grid-cols-5'
                  }`}
                >
                  <Cell>Reservation</Cell>
                  <Cell>
                    {downPaymentDateLabel
                      ? format(downPaymentDateLabel, 'dd.MM.yyyy')
                      : '-'}
                  </Cell>
                  <Cell>Down payment</Cell>
                  <Cell>{fmt(downAmount)}</Cell>
                  {hasInterest && <Cell>-</Cell>}
                  <Cell>{fmt(downAmount)}</Cell>
                </div>
              );
            })()}
            {Array.from({ length: installmentCount }).map((_, index) => {
              const dueDate = getDueDate(index);
              const interest = getInterest(index);
              const isLast = index === installmentCount - 1;
              const installPrincipal = effectivePrincipals[index];
              const rowTotal = installPrincipal + interest;
              const isNegative = isLast && installPrincipal < 0;
              grandTotal += rowTotal;
              return (
                <div
                  key={index}
                  className={`grid ${
                    hasInterest ? 'grid-cols-6' : 'grid-cols-5'
                  }`}
                >
                  <Cell>{index + 1}</Cell>
                  <Cell>
                    <DatePicker
                      value={dueDate}
                      onChange={(date) => {
                        const d = Array.isArray(date) ? date[0] : date;
                        setDueDate(index, d || undefined);
                      }}
                      placeholder="Pick date"
                    />
                  </Cell>
                  <Cell>Progress payment</Cell>
                  {isLast ? (
                    <Cell className={isNegative ? 'text-destructive font-medium' : ''}>
                      {fmt(installPrincipal)}
                      {isNegative && <span className="ml-1 text-xs">(over)</span>}
                    </Cell>
                  ) : (
                    <Cell className="p-1">
                      <PrincipalInput
                        index={index}
                        value={installPrincipal}
                        onCommit={handlePrincipalCommit}
                      />
                    </Cell>
                  )}
                  {hasInterest && <Cell>{fmt(interest)}</Cell>}
                  <Cell>{fmt(rowTotal)}</Cell>
                </div>
              );
            })}
            {completionAmount > 0 && (() => {
              grandTotal += completionAmount;
              return (
                <div
                  className={`grid ${
                    hasInterest ? 'grid-cols-6' : 'grid-cols-5'
                  }`}
                >
                  <Cell>Completion</Cell>
                  <Cell className="text-muted-foreground text-xs">After building completed</Cell>
                  <Cell>Completion payment</Cell>
                  <Cell>{fmt(completionAmount)}</Cell>
                  {hasInterest && <Cell>-</Cell>}
                  <Cell>{fmt(completionAmount)}</Cell>
                </div>
              );
            })()}
          </>
        )}
        <div
          className={`grid ${
            hasInterest ? 'grid-cols-6' : 'grid-cols-5'
          } bg-sidebar border-t font-medium`}
        >
          <Cell>Total</Cell>
          <Cell>{discountPct > 0 ? `Discount: ${fmt(discountAmount)}` : ' '}</Cell>
          <Cell> </Cell>
          <Cell>{fmt(principal + downAmount + barterValue)}</Cell>
          {hasInterest && (
            <Cell>{fmt(grandTotal - (principal + downAmount + barterValue))}</Cell>
          )}
          <Cell>{fmt(grandTotal)}</Cell>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
