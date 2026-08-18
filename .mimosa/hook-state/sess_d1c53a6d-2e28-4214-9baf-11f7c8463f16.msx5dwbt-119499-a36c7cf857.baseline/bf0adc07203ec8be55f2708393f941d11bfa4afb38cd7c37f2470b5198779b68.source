import { useQuery } from '@apollo/client';
import { GET_AGENCIES } from '../graphql';
import { IAgency } from '../types/agencyTypes';

export type AgenciesFilterVars = {
  searchValue?: string;
  city?: string;
  district?: string;
};

type TGetAgenciesResponse = {
  getBlockAdminAgencies: {
    list: IAgency[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
    totalCount: number;
  };
};

type UseAgenciesResult = {
  agencies: IAgency[] | undefined;
  totalCount: number | undefined;
  loading: boolean;
  error: Error | undefined;
};

export const useAgencies = (filter?: AgenciesFilterVars): UseAgenciesResult => {
  const { data, loading, error } = useQuery<TGetAgenciesResponse>(
    GET_AGENCIES,
    {
      variables: filter,
    },
  );
  return {
    agencies: data?.getBlockAdminAgencies?.list,
    totalCount: data?.getBlockAdminAgencies?.totalCount,
    loading,
    error,
  };
};
