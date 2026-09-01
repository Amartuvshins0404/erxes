import { QueryHookOptions, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_AGENCY_AGENTS } from '../graphql';
import { IAgencyAgent } from '../types/agencyTypes';

type GetAgencyAgentsResponse = {
  getBlockAdminAgencyAgents: {
    list: IAgencyAgent[];
    totalCount: number;
  };
};

type GetAgencyAgentsVariables = {
  agencyId?: string;
  searchValue?: string;
};


export const useAgencyAgents = (
  options?: QueryHookOptions<GetAgencyAgentsResponse, GetAgencyAgentsVariables>,
) => {
  const { id } = useParams();
  const agencyId = options?.variables?.agencyId ?? id;

  const { data, loading, error } = useQuery<
    GetAgencyAgentsResponse,
    GetAgencyAgentsVariables
  >(GET_AGENCY_AGENTS, {
    ...options,
    variables: { ...options?.variables, agencyId },
    skip: !agencyId || options?.skip,
  });

  return {
    agents: data?.getBlockAdminAgencyAgents?.list ?? [],
    totalCount: data?.getBlockAdminAgencyAgents?.totalCount ?? 0,
    loading,
    error,
  };
};
