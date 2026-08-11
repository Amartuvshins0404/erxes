import { IOfferDocument } from '@/contract/@types/offer';

// Ported 1:1 from block_ui's OfferDetailSheet.tsx#OfferSchedule so the
// client portal can get the same computed schedule as structured data,
// without needing to re-implement this math on every consumer.

export interface IScheduleRow {
  label: string;
  date: Date | null;
  type: string;
  amount: number;
}

const parseDateLike = (value: any): Date | null => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

const setSafeDay = (date: Date, day: number) => {
  const d = new Date(date);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};

const addMonths = (base: Date, months: number) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addYears = (base: Date, years: number) => {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const generateInstallmentDates = (
  startDate: Date,
  count: number,
  frequency: string | undefined,
  paymentDates: number[],
): Date[] => {
  const dates: Date[] = [];
  const days = paymentDates.length ? paymentDates : [15];

  const push = (computed: Date) => {
    dates.push(dates.length === 0 ? startDate : computed);
  };

  switch (frequency) {
    case 'ONE_TIME_PER_MONTH': {
      for (let i = 0; i < count; i++) push(setSafeDay(addMonths(startDate, i), days[0]));
      break;
    }
    case 'TWO_TIME_PER_MONTH': {
      const dd = days.length >= 2 ? days.slice(0, 2) : [15, 30];
      const monthsNeeded = Math.ceil(count / 2);
      for (let m = 0; m < monthsNeeded; m++)
        for (let i = 0; i < dd.length && dates.length < count; i++)
          push(setSafeDay(addMonths(startDate, m), dd[i]));
      break;
    }
    case 'THREE_TIME_PER_MONTH': {
      const dd = days.length >= 3 ? days.slice(0, 3) : [10, 20, 30];
      const monthsNeeded = Math.ceil(count / 3);
      for (let m = 0; m < monthsNeeded; m++)
        for (let i = 0; i < dd.length && dates.length < count; i++)
          push(setSafeDay(addMonths(startDate, m), dd[i]));
      break;
    }
    case 'QUARTERLY': {
      for (let i = 0; i < count; i++) push(setSafeDay(addMonths(startDate, i * 3), days[0]));
      break;
    }
    case 'HALF_YEARLY': {
      for (let i = 0; i < count; i++) push(setSafeDay(addMonths(startDate, i * 6), days[0]));
      break;
    }
    case 'YEARLY': {
      for (let i = 0; i < count; i++) push(setSafeDay(addYears(startDate, i), days[0]));
      break;
    }
    case 'ONE_TIME': {
      break;
    }
    default: {
      for (let i = 0; i < count; i++) push(setSafeDay(addMonths(startDate, i), days[0]));
    }
  }

  return dates;
};

const periodsPerYear = (frequency: string | undefined): number => {
  switch (frequency) {
    case 'ONE_TIME_PER_MONTH':
      return 12;
    case 'TWO_TIME_PER_MONTH':
      return 24;
    case 'THREE_TIME_PER_MONTH':
      return 36;
    case 'QUARTERLY':
      return 4;
    case 'HALF_YEARLY':
      return 2;
    case 'YEARLY':
      return 1;
    default:
      return 12;
  }
};

export const buildOfferPaymentSchedule = (
  offer: IOfferDocument,
): { rows: IScheduleRow[]; total: number } => {
  const { paymentPlan, amount, date } = offer;

  if (!paymentPlan) {
    return { rows: [], total: 0 };
  }

  const totalPrice = amount || 0;
  const discountPct = paymentPlan.discountPercentage || 0;
  const downPct = paymentPlan.downPaymentPercentage || 0;
  const barterPct = paymentPlan.barterPercentage || 0;
  const completionPct = paymentPlan.completionPaymentPercentage || 0;
  const interestPct = paymentPlan.interestPercentage || 0;
  const interestType = paymentPlan.interestType || 'FLAT';
  const frequency = paymentPlan.frequency;
  const isOneTime = frequency === 'ONE_TIME';
  const installmentCount = isOneTime
    ? 0
    : Math.max(0, paymentPlan.installment || 0);
  const ppy = periodsPerYear(frequency);

  const discountAmount = (totalPrice * discountPct) / 100;
  const priceAfterDiscount = totalPrice - discountAmount;
  const downAmount =
    (paymentPlan.downPaymentAmount || 0) > 0
      ? (paymentPlan.downPaymentAmount as number)
      : (priceAfterDiscount * downPct) / 100;
  const barterValue =
    (paymentPlan.barterAmount || 0) > 0
      ? (paymentPlan.barterAmount as number)
      : (priceAfterDiscount * barterPct) / 100;
  const completionAmount =
    (paymentPlan.completionPaymentAmount || 0) > 0
      ? (paymentPlan.completionPaymentAmount as number)
      : (priceAfterDiscount * completionPct) / 100;
  const principal =
    priceAfterDiscount - downAmount - barterValue - completionAmount;

  const roundedAmount = paymentPlan.roundedInstallmentAmount || 0;
  const basePerInstallment =
    installmentCount > 0
      ? roundedAmount > 0
        ? roundedAmount
        : principal / installmentCount
      : 0;

  const savedAmounts: number[] = paymentPlan.installmentAmounts || [];
  const effectivePrincipals = Array.from(
    { length: installmentCount },
    (_, i) => (savedAmounts[i] > 0 ? savedAmounts[i] : basePerInstallment),
  );
  if (installmentCount > 0) {
    const sumOfOthers = effectivePrincipals
      .slice(0, -1)
      .reduce((a, b) => a + b, 0);
    const last = savedAmounts[installmentCount - 1];
    effectivePrincipals[installmentCount - 1] =
      last > 0 ? last : principal - sumOfOthers;
  }

  const getInterest = (i: number): number => {
    if (interestPct <= 0 || installmentCount <= 0) return 0;
    if (interestType === 'FLAT') {
      return (principal * interestPct) / 100 / installmentCount;
    }
    if (interestType === 'REDUCING') {
      const paidSoFar = effectivePrincipals
        .slice(0, i)
        .reduce((a, b) => a + b, 0);
      return ((principal - paidSoFar) * interestPct) / 100 / ppy;
    }
    return (((principal * interestPct) / 100) * (installmentCount / ppy)) / installmentCount;
  };

  const baseDate =
    parseDateLike(paymentPlan.firstPaymentDate) ||
    parseDateLike(date) ||
    new Date();
  const autoDates = generateInstallmentDates(
    baseDate,
    installmentCount,
    frequency,
    paymentPlan.paymentDates || [],
  );
  const customDates = paymentPlan.paymentDueDates || [];
  const getDate = (i: number) => {
    const override = customDates[i] ? parseDateLike(customDates[i]) : null;
    return override || autoDates[i] || null;
  };

  const rows: IScheduleRow[] = [];

  if (isOneTime) {
    rows.push({
      label: 'Full payment',
      date: parseDateLike(date),
      type: 'One-time',
      amount: priceAfterDiscount + (priceAfterDiscount * interestPct) / 100,
    });
  } else {
    const contractDate = parseDateLike(date);
    const downDate = parseDateLike(paymentPlan.downPaymentDate) || contractDate;

    if (barterValue > 0) {
      rows.push({
        label: 'Barter',
        date: contractDate,
        type: 'Barter',
        amount: barterValue,
      });
    }
    if (downAmount > 0) {
      rows.push({
        label: 'Reservation',
        date: downDate,
        type: 'Down payment',
        amount: downAmount,
      });
    }
    for (let i = 0; i < installmentCount; i++) {
      rows.push({
        label: String(i + 1),
        date: getDate(i),
        type: 'Progress payment',
        amount: effectivePrincipals[i] + getInterest(i),
      });
    }
    if (completionAmount > 0) {
      rows.push({
        label: 'Completion',
        date: parseDateLike(paymentPlan.completionPaymentDate),
        type: 'Completion payment',
        amount: completionAmount,
      });
    }
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return { rows, total };
};
