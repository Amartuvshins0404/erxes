import { useQuery } from '@apollo/client';
import { MASTRA_AGENT } from '~/graphql/queries';
import { IMastraAgentResponse } from '../types';

/** Fetches a single agent for the edit form; skipped on the create route. */
export const useAgent = (id?: string, skip = false) => {
  const { data, loading, error } = useQuery<IMastraAgentResponse>(
    MASTRA_AGENT,
    {
      variables: { _id: id },
      skip: skip || !id,
    },
  );

  return { agent: data?.mastraAgent ?? null, loading, error };
};
