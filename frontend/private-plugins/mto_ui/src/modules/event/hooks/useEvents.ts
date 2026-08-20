import { useQuery } from '@apollo/client';
import { useNonNullMultiQueryState } from 'erxes-ui';
import { MTO_EVENTS } from '@/event/graphql/eventQueries';
import { EventStatus, MtoEvent } from '@/event/types/event';

const parseBooleanQuery = (value?: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const toIsoDate = (value?: string, endOfDay?: boolean): string | undefined => {
  if (!value) return undefined;

  const date = new Date(endOfDay ? `${value}T23:59:59` : value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
};

export function useEvents() {
  const { status, isActive, searchValue, startDateFrom, startDateTo, categoryId } =
    useNonNullMultiQueryState<{
      status: string;
      isActive: string;
      searchValue: string;
      startDateFrom: string;
      startDateTo: string;
      categoryId: string;
    }>([
      'status',
      'isActive',
      'searchValue',
      'startDateFrom',
      'startDateTo',
      'categoryId',
    ]);

  const { data, loading, refetch } = useQuery(MTO_EVENTS, {
    variables: {
      status: (status as EventStatus | undefined) || undefined,
      isActive: parseBooleanQuery(isActive),
      searchValue: searchValue || undefined,
      startDateFrom: toIsoDate(startDateFrom),
      startDateTo: toIsoDate(startDateTo, true),
      categoryId: categoryId || undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  const events: MtoEvent[] = data?.mtoEvents ?? [];

  return { events, loading, refetch };
}
