import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { MASTRA_SCHEDULE_TRANSCRIPT } from '~/graphql/queries';
import { AgentUIMessage, DbThreadMessage } from '~/modules/chat/types';
import { metaToUIMessages } from '~/modules/chat/lib/messageMapping';

interface ScheduleTranscriptResponse {
  mastraScheduleTranscript: DbThreadMessage[] | null;
}

// The read-only transcript of a schedule's background run thread, mapped through
// the SAME persisted-message → UIMessage pipeline the chat history uses
// (metaToUIMessages) so the schedule runs render with the identical bubbles,
// markdown, reasoning, and inline tool/chart parts. Authorized + resource-scoped
// on the server (mastraScheduleTranscript); a viewer who can't access the agent
// gets an error, and a schedule that has never run resolves to an empty list.
export const useScheduleTranscript = (scheduleId?: string) => {
  const { data, loading, error, refetch } =
    useQuery<ScheduleTranscriptResponse>(MASTRA_SCHEDULE_TRANSCRIPT, {
      variables: { scheduleId: scheduleId ?? '' },
      skip: !scheduleId,
      // The thread grows on every run (incl. "Run now"), so always re-read from
      // the network rather than serving a stale cached transcript.
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    });

  const messages: AgentUIMessage[] = useMemo(
    () => metaToUIMessages(data?.mastraScheduleTranscript ?? []),
    [data?.mastraScheduleTranscript],
  );

  return {
    messages,
    // Only the first read shows the skeleton; background refetches keep `data`.
    loading: loading && !data,
    error,
    refetch,
  };
};
