import { QueryHookOptions, useQuery } from '@apollo/client';
import { IAgency } from '../types/agencyTypes';
import { GET_AGENCY_INFO } from '../graphql';

type GetAgencyInfoResponse = {
  getBlockAdminAgencyInfo: IAgency & { __typename: string };
};

export const useAgencyDetail = (
  options?: QueryHookOptions<GetAgencyInfoResponse>,
) => {
  const { data, error, loading } = useQuery<GetAgencyInfoResponse>(
    GET_AGENCY_INFO,
    options,
  );

  return {
    agency: data?.getBlockAdminAgencyInfo,
    error,
    loading,
  };
};
