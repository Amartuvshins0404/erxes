import { Table } from 'erxes-ui';
import { format } from 'date-fns';

export const STATUS_TYPE_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
> = {
  reserved: 'warning',
  draft: 'secondary',
  signed: 'success',
  cancelled: 'destructive',
  lost: 'destructive',
};

export const formatDate = (value: any): string | undefined => {
  if (!value) return undefined;
  const num = Number(value);
  const date = new Date(isNaN(num) ? value : num);
  if (isNaN(date.getTime())) return undefined;
  return format(date, 'dd.MM.yyyy');
};

export const formatAmount = (amount?: number, currency = 'MNT') => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const renderRow = (
  label: string,
  value: React.ReactNode,
  isFirst = false,
  isLast = false,
) => (
  <Table.Row>
    <Table.Cell
      className={`bg-sidebar h-auto min-h-10 p-2 bt:whitespace-auto ${
        isFirst ? 'bt:rounded-tl-lg' : ''
      } ${isLast ? 'bt:rounded-bl-lg' : ''}`}
    >
      {label}
    </Table.Cell>
    <Table.Cell
      className={`min-h-10 h-auto p-2 whitespace-normal ${
        isFirst ? 'bt:rounded-tr-lg' : ''
      } ${isLast ? 'bt:rounded-br-lg' : ''}`}
    >
      {value == null || value === '' ? '-' : value}
    </Table.Cell>
  </Table.Row>
);

export const parseDateLike = (value: any): Date | null => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

export const setSafeDay = (date: Date, day: number) => {
  const d = new Date(date);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};

export function generateInstallmentDates(
  startDate: Date,
  count: number,
  frequency: string | undefined,
  paymentDates: number[],
): Date[] {
  const dates: Date[] = [];
  const days = paymentDates.length ? paymentDates : [15];

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

  switch (frequency) {
    case 'ONE_TIME_PER_MONTH': {
      for (let i = 0; i < count; i++) {
        dates.push(setSafeDay(addMonths(startDate, i + 1), days[0]));
      }
      break;
    }
    case 'TWO_TIME_PER_MONTH': {
      const dd = days.length >= 2 ? days.slice(0, 2) : [15, 30];
      const monthsNeeded = Math.ceil(count / 2);
      for (let m = 0; m < monthsNeeded; m++) {
        for (let i = 0; i < dd.length && dates.length < count; i++) {
          dates.push(setSafeDay(addMonths(startDate, m + 1), dd[i]));
        }
      }
      break;
    }
    case 'THREE_TIME_PER_MONTH': {
      const dd = days.length >= 3 ? days.slice(0, 3) : [10, 20, 30];
      const monthsNeeded = Math.ceil(count / 3);
      for (let m = 0; m < monthsNeeded; m++) {
        for (let i = 0; i < dd.length && dates.length < count; i++) {
          dates.push(setSafeDay(addMonths(startDate, m + 1), dd[i]));
        }
      }
      break;
    }
    case 'QUARTERLY': {
      for (let i = 0; i < count; i++) {
        dates.push(setSafeDay(addMonths(startDate, (i + 1) * 3), days[0]));
      }
      break;
    }
    case 'HALF_YEARLY': {
      for (let i = 0; i < count; i++) {
        dates.push(setSafeDay(addMonths(startDate, (i + 1) * 6), days[0]));
      }
      break;
    }
    case 'YEARLY': {
      for (let i = 0; i < count; i++) {
        dates.push(setSafeDay(addYears(startDate, i + 1), days[0]));
      }
      break;
    }
    case 'ONE_TIME': {
      break;
    }
    default: {
      for (let i = 0; i < count; i++) {
        dates.push(setSafeDay(addMonths(startDate, i + 1), days[0]));
      }
    }
  }
  return dates;
}
