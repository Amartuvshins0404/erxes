import { MASTRA_SCHEDULES } from '~/graphql/queries';
import { useResourceList } from '~/components/useResourceList';
import { ISchedule, ISchedulesQueryResponse } from '../types';

/**
 * All schedules for the list page. Network-only so the table reflects edits.
 * `agentId` scopes the list to a single agent (the per-agent Schedules tab).
 */
export const useSchedules = (agentId?: string) => {
  const { items, loading, refetch } = useResourceList<
    ISchedulesQueryResponse,
    ISchedule
  >(
    MASTRA_SCHEDULES,
    (data) => data?.mastraSchedules ?? [],
    agentId ? { agentId } : undefined,
  );

  return { schedules: items, loading, refetch };
};
