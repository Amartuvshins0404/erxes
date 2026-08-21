import { QueryHookOptions, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_AGENCY_AGENTS } from '../graphql';
import { IAgencyAgent } from '../types/agencyTypes';

type GetAgencyAgentsResponse = {
  getBlockAdminAgents: {
    list: IAgencyAgent[];
    totalCount: number;
  };
};

type GetAgencyAgentsVariables = {
  agencyId?: string;
  searchValue?: string;
};

/**
 * Agents of the agency in the current `/blockadmin/agencies/agencies/:id`
 * route. `agencyId` is the block admin agency id; the API resolves it to the
 * agency tenant that owns the members.
 */
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
    agents: data?.getBlockAdminAgents?.list ?? [],
    totalCount: data?.getBlockAdminAgents?.totalCount ?? 0,
    loading,
    error,
  };
};
