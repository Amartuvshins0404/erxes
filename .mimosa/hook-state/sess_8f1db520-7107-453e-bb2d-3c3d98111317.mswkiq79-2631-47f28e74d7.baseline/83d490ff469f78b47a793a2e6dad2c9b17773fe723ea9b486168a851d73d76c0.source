import { useQuery } from '@apollo/client';
import {
  GET_AGENCY_UNITS,
  GET_AGENCY_UNITS_TOTAL_COUNT,
} from '../graphql/queries';
import { BlockUnitStatus, IBlockAgencyUnit } from '../types/unit';

type GetUnitsResponse = {
  blockAgencyGetUnits: IBlockAgencyUnit[];
};

type GetUnitsTotalCountResponse = {
  blockAgencyGetUnitsTotalCount: number;
};

const PER_PAGE = 20;

export const useGetUnits = ({
  agencyId,
  status,
  page = 1,
}: { agencyId?: string; status?: BlockUnitStatus; page?: number } = {}) => {
  const { data, loading, error, refetch } = useQuery<GetUnitsResponse>(
    GET_AGENCY_UNITS,
    {
      variables: { agencyId, status, page, perPage: PER_PAGE },
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: countData } = useQuery<GetUnitsTotalCountResponse>(
    GET_AGENCY_UNITS_TOTAL_COUNT,
    {
      variables: { agencyId, status },
    },
  );

  return {
    units: data?.blockAgencyGetUnits || [],
    totalCount: countData?.blockAgencyGetUnitsTotalCount || 0,
    loading,
    error,
    refetch,
    perPage: PER_PAGE,
  };
};
