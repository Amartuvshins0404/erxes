import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import { GET_AGENCIES, GET_AGENCIES_INLINE } from '../graphql';
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

export type IAgencyInline = Pick<IAgency, '_id' | 'name' | 'brandName'>;

type TGetAgenciesInlineResponse = {
  getBlockAdminAgencies: {
    list?: IAgencyInline[];
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
    totalCount?: number;
  };
};

const INLINE_PER_PAGE = 20;

export const useAgenciesInline = (
  options?: QueryHookOptions<TGetAgenciesInlineResponse>,
) => {
  const { data, loading, error, fetchMore } =
    useQuery<TGetAgenciesInlineResponse>(GET_AGENCIES_INLINE, {
      ...options,
      variables: {
        limit: INLINE_PER_PAGE,
        ...options?.variables,
      },
    });

  const { list, pageInfo, totalCount } = data?.getBlockAdminAgencies || {};

  const handleFetchMore = (
    direction: EnumCursorDirection = EnumCursorDirection.FORWARD,
  ) => {
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        ...options?.variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: INLINE_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          ...prev,
          getBlockAdminAgencies: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.getBlockAdminAgencies,
            prevResult: prev.getBlockAdminAgencies,
          }),
        };
      },
    });
  };

  return {
    agencies: list,
    totalCount,
    pageInfo,
    loading,
    error,
    handleFetchMore,
  };
};
