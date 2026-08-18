import { DayOfWeek } from '../types/schedule';
import type {
  OneFitDailySchedule,
  OneFitDailyScheduleRow,
} from '../types/schedule';

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

export const GENDER_RESTRICTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'mixed', label: 'Mixed' },
] as const;

export const DAYS_OF_WEEK = Object.values(DayOfWeek).map((day) => ({
  value: day,
  label: day.charAt(0).toUpperCase() + day.slice(1),
}));

/** Default form row: one weekday, for "Add Schedule" */
export const getDefaultDailySchedule = (): Omit<
  OneFitDailyScheduleRow,
  'activityTypeId'
> => ({
  daysOfWeek: [DayOfWeek.MONDAY],
  genderRestriction: 'mixed',
  startTime: '09:00',
  endTime: '17:00',
  dailyLimit: 10,
});

/**
 * Group API dailySchedules by (activityTypeId, genderRestriction, startTime, endTime, dailyLimit)
 * into form rows with daysOfWeek[] for edit load.
 */
export function groupDailySchedulesToRows(
  dailySchedules: OneFitDailySchedule[],
): OneFitDailyScheduleRow[] {
  const key = (d: OneFitDailySchedule) =>
    `${d.activityTypeId}|${d.genderRestriction}|${d.startTime}|${d.endTime}|${d.dailyLimit}`;
  const map = new Map<string, OneFitDailyScheduleRow>();
  for (const d of dailySchedules) {
    const k = key(d);
    const existing = map.get(k);
    if (existing) {
      if (!existing.daysOfWeek.includes(d.dayOfWeek)) {
        existing.daysOfWeek.push(d.dayOfWeek);
      }
    } else {
      map.set(k, {
        daysOfWeek: [d.dayOfWeek],
        activityTypeId: d.activityTypeId,
        genderRestriction: d.genderRestriction,
        startTime: d.startTime,
        endTime: d.endTime,
        dailyLimit: d.dailyLimit,
      });
    }
  }
  return Array.from(map.values());
}

export const getCurrentMonth = () => new Date().getMonth() + 1;

export const getCurrentYear = () => new Date().getFullYear();

export const getNextMonth = () => {
  const nextMonth = getCurrentMonth() + 1;
  return nextMonth > 12 ? 1 : nextMonth;
};
