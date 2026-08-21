import { QueryHookOptions, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_AGENCY_INFO } from '../graphql';
import { IAgency } from '../types/agencyTypes';

type GetAgencyInfoResponse = {
  getBlockAdminAgencyInfo: IAgency;
};

type GetAgencyInfoVariables = {
  id?: string;
};

/**
 * Reads the agency of the current `/blockadmin/agencies/agencies/:id` route.
 * Pass `variables.id` to read another agency, e.g. from a listing row.
 */
export const useAgencyDetail = (
  options?: QueryHookOptions<GetAgencyInfoResponse, GetAgencyInfoVariables>,
) => {
  const { id } = useParams();
  const agencyId = options?.variables?.id ?? id;

  const { data, error, loading, refetch } = useQuery<
    GetAgencyInfoResponse,
    GetAgencyInfoVariables
  >(GET_AGENCY_INFO, {
    ...options,
    variables: { id: agencyId },
    skip: !agencyId || options?.skip,
  });

  return {
    agency: data?.getBlockAdminAgencyInfo,
    error,
    loading,
    refetch,
  };
};
