import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { parseISO } from 'date-fns';
import { ONE_FIT_MONTH_AVAILABILITY } from '../graphql/scheduleQueries';
import type { OneFitDayAvailability } from '../types/schedule';

export function useMonthAvailability(
  month: Date,
  providerId: string | undefined,
  activityTypeId: string | undefined,
) {
  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const { data, loading, error } = useQuery(ONE_FIT_MONTH_AVAILABILITY, {
    variables: {
      providerId: providerId ?? '',
      activityTypeId: activityTypeId ?? '',
      year,
      month: monthNum,
    },
    skip: !providerId || !activityTypeId,
  });

  const daysByDate = useMemo(() => {
    const map = new Map<number, OneFitDayAvailability>();
    const days = data?.oneFitMonthAvailability?.days ?? [];
    for (const day of days) {
      const d =
        typeof day.date === 'string' ? parseISO(day.date) : new Date(day.date);
      const key = startOfDay(d).getTime();
      map.set(key, day);
    }
    return map;
  }, [data]);

  return {
    daysByDate,
    loading,
    error,
  };
}
