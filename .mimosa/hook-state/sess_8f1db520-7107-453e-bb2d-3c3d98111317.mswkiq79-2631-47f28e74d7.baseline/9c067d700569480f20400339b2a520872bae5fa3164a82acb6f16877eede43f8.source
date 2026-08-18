import { QueryHookOptions, useQuery } from '@apollo/client';
import { IBlockAgencyMember } from '../types/member';
import { GET_MEMBER_PROFILE } from '../graphql';

type QueryResponse = {
  blockAgentGetMemberProfile: IBlockAgencyMember;
};

export const useGetMemberProfile = (options?: QueryHookOptions) => {
  const { data, loading, error } = useQuery<QueryResponse>(
    GET_MEMBER_PROFILE,
    options,
  );

  return {
    profile: data?.blockAgentGetMemberProfile,
    loading,
    error,
  };
};
