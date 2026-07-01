// Pure cron <-> structured-timing helpers for the schedule builder. Kept out of
// the component file so Fast Refresh can preserve component state and the logic
// stays unit-testable on its own.

export type ScheduleFrequency =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export interface TimingParts {
  freq: Exclude<ScheduleFrequency, 'custom'>;
  minute: number;
  hour: number;
  weekdays: number[];
  dayOfMonth: number;
}

export const DEFAULT_PARTS: TimingParts = {
  freq: 'daily',
  minute: 0,
  hour: 9,
  weekdays: [1],
  dayOfMonth: 1,
};

export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export const FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom (cron)' },
];

/** Emit the cron expression for one structured timing choice. */
export function buildCron(parts: TimingParts): string {
  const { freq, minute, hour, weekdays, dayOfMonth } = parts;
  if (freq === 'hourly') return `${minute} * * * *`;
  if (freq === 'daily') return `${minute} ${hour} * * *`;
  if (freq === 'weekly') {
    const days = [...weekdays].sort((a, b) => a - b).join(',');
    return `${minute} ${hour} * * ${days || '1'}`;
  }
  return `${minute} ${hour} ${dayOfMonth} * *`;
}

/** Parse a plain decimal string; null for anything fancier. */
const num = (s: string): number | null =>
  /^\d+$/.test(s) ? Number.parseInt(s, 10) : null;

/** Expand a cron weekday field ("1,3" / "1-5") to a day list; null if fancy. */
function expandWeekdays(field: string): number[] | null {
  const days = new Set<number>();
  for (const part of field.split(',')) {
    const range = /^(\d)-(\d)$/.exec(part);
    if (range) {
      const from = Number.parseInt(range[1], 10);
      const to = Number.parseInt(range[2], 10);
      if (from > to || to > 7) return null;
      for (let day = from; day <= to; day++) days.add(day % 7);
      continue;
    }
    const day = num(part);
    if (day == null || day > 7) return null;
    days.add(day % 7);
  }
  return days.size ? [...days] : null;
}

/** Read a cron back into builder parts; null when it needs the custom view. */
export function parseCron(cron: string): TimingParts | null {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const minute = num(fields[0]);
  if (minute == null || minute > 59) return null;

  if (
    fields[1] === '*' &&
    fields[2] === '*' &&
    fields[3] === '*' &&
    fields[4] === '*'
  ) {
    return { ...DEFAULT_PARTS, freq: 'hourly', minute };
  }
  const hour = num(fields[1]);
  if (hour == null || hour > 23) return null;

  if (fields[2] === '*' && fields[3] === '*') {
    if (fields[4] === '*') {
      return { ...DEFAULT_PARTS, freq: 'daily', minute, hour };
    }
    const weekdays = expandWeekdays(fields[4]);
    if (!weekdays) return null;
    return { ...DEFAULT_PARTS, freq: 'weekly', minute, hour, weekdays };
  }

  if (fields[3] === '*' && fields[4] === '*') {
    const dayOfMonth = num(fields[2]);
    if (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 31) return null;
    return { ...DEFAULT_PARTS, freq: 'monthly', minute, hour, dayOfMonth };
  }
  return null;
}

/** Zero-pad to two digits for HH:MM rendering. */
export const pad = (n: number) => String(n).padStart(2, '0');

/** English ordinal suffix: 1st, 2nd, 3rd, 4th… 11th–13th included. */
function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** Human-readable one-liner of when the schedule fires. */
export function describeTiming(
  freq: ScheduleFrequency,
  parts: TimingParts,
  cron: string,
  timezone: string,
): string {
  const time = `${pad(parts.hour)}:${pad(parts.minute)}`;
  const tz = timezone || 'UTC';
  if (freq === 'hourly') {
    return `Runs every hour at minute ${parts.minute} · ${tz}`;
  }
  if (freq === 'daily') return `Runs every day at ${time} · ${tz}`;
  if (freq === 'weekly') {
    const names = WEEKDAYS.filter((d) => parts.weekdays.includes(d.value))
      .map((d) => d.label)
      .join(', ');
    return `Runs every ${names || 'Mon'} at ${time} · ${tz}`;
  }
  if (freq === 'monthly') {
    return `Runs on the ${ordinal(
      parts.dayOfMonth,
    )} of every month at ${time} · ${tz}`;
  }
  return `Runs on cron "${cron.trim() || '—'}" · ${tz}`;
}
