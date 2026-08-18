import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  parseDateRangeFromString,
  useMultiQueryState,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { SUPPLIERS_CURSOR_SESSION_KEY } from '../constants/cursorSessionKey';
import { MUSHOP_SUPPLIERS } from '../graphql/queries';
import { ISupplierList } from '../types';

const SUPPLIERS_PER_PAGE = 20;

export const useSupplierVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, created, foundedAt, city, district, status }] =
    useMultiQueryState<{
      searchValue: string;
      created: string;
      foundedAt: string;
      city: string;
      district: string;
      status: string;
    }>(['searchValue', 'created', 'foundedAt', 'city', 'district', 'status']);

  const dateFilters: Record<string, any> = {};

  if (created) {
    dateFilters.createdAt = {
      gte: parseDateRangeFromString(created)?.from,
      lte: parseDateRangeFromString(created)?.to,
    };
  }

  if (foundedAt) {
    dateFilters.dateFounded = {
      gte: parseDateRangeFromString(foundedAt)?.from,
      lte: parseDateRangeFromString(foundedAt)?.to,
    };
  }

  return {
    ...(variables || {}),
    searchValue: searchValue || undefined,
    city: city || undefined,
    district: district || undefined,
    dateFilters: Object.keys(dateFilters)?.length ? JSON.stringify(dateFilters) : undefined,
    verificationStatus: status || undefined,
  };
};

export const useSuppliers = (options?: QueryHookOptions) => {
  const variables = useSupplierVariables(options?.variables);
  const { cursor } = useRecordTableCursor({
    sessionKey: SUPPLIERS_CURSOR_SESSION_KEY,
  });

  const { data, loading, fetchMore } = useQuery<{
    mushopSuppliers: ISupplierList;
  }>(MUSHOP_SUPPLIERS, {
    ...options,
    variables: { ...variables, cursor, limit: SUPPLIERS_PER_PAGE },
  });

  const { list: suppliers, pageInfo, totalCount } = data?.mushopSuppliers || {};

  const handleFetchMore = ({
    direction = EnumCursorDirection.FORWARD,
  }: {
    direction?: EnumCursorDirection;
  } = {}) => {
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: SUPPLIERS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          mushopSuppliers: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mushopSuppliers,
            prevResult: prev.mushopSuppliers,
          }),
        });
      },
    });
  };

  return { suppliers, loading, pageInfo, totalCount, handleFetchMore };
};
