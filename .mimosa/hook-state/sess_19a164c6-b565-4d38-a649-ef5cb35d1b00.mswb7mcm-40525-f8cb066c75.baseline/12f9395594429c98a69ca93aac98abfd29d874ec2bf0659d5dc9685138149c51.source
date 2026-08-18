import {
  endOfDay,
  format,
  startOfDay,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { type DashboardPreset } from '~/components/dashboard/main-indicators-dashboard/types';

export function getRangeByPreset(preset: DashboardPreset): {
  from: Date;
  to: Date;
} {
  const now = new Date();
  const to = endOfDay(now);

  if (preset === '1w') return { from: startOfDay(subWeeks(now, 1)), to };
  if (preset === '2w') return { from: startOfDay(subWeeks(now, 2)), to };
  if (preset === '1m') return { from: startOfDay(subMonths(now, 1)), to };
  if (preset === '2m') return { from: startOfDay(subMonths(now, 2)), to };

  return { from: startOfDay(subYears(now, 1)), to };
}

export function toDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateInputValue(value: string): Date | null {
  if (!value) return null;

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate;
}

export function formatMetricValue(value: number, isAverage: boolean): string {
  if (isAverage) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  return Math.round(value).toLocaleString();
}
