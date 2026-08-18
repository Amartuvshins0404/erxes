import { QueryHookOptions, useQuery } from '@apollo/client';
import { IAgencyMember } from '../types/member';
import { GET_AGENCY_MEMBERS } from '../graphql';

type TQueryResponse = {
  blockAgentGetMembers: IAgencyMember[];
};

export const useAgencyMembers = (options?: QueryHookOptions) => {
  const { data, loading, error } = useQuery<TQueryResponse>(
    GET_AGENCY_MEMBERS,
    options,
  );

  return {
    agencyMembers: data?.blockAgentGetMembers || [],
    loading,
    error,
  };
};
